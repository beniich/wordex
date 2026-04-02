"""
ws_server.py — Serveur WebSocket collaboratif
  - Synchronisation Yjs (protocole y-websocket binaire)
  - Présence en temps réel (curseurs, utilisateurs actifs)
  - Rooms isolées par document_id
  - Authentification JWT à la connexion
"""
import asyncio
import json
import logging
import os
import struct
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

import jwt
import websockets
from websockets.server import WebSocketServerProtocol
import redis.asyncio as redis

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-please")
ALGORITHM  = "HS256"
HOST       = os.getenv("WS_HOST", "0.0.0.0")
PORT       = int(os.getenv("WS_PORT", "1234"))
REDIS_URL  = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.from_url(REDIS_URL, decode_responses=False)

# ── Types de messages Yjs (protocol y-websocket) ─────────────────────────────
MSG_SYNC        = 0
MSG_AWARENESS   = 1
MSG_AUTH        = 2
MSG_QUERY_AWARENESS = 3

SYNC_STEP1  = 0
SYNC_STEP2  = 1
SYNC_UPDATE = 2

# ── Data structures ───────────────────────────────────────────────────────────

@dataclass
class Client:
    ws:          WebSocketServerProtocol
    user_id:     str
    username:    str
    color:       str
    doc_id:      str
    awareness:   Optional[bytes] = None   # dernière awareness state encodée

@dataclass
class Room:
    doc_id:   str
    clients:  dict[str, Client]           = field(default_factory=dict)  # conn_id → Client
    doc_state: bytearray                  = field(default_factory=bytearray)  # Yjs state vector snapshot

# conn_id → Client
_clients: dict[str, Client] = {}
# doc_id  → Room
_rooms:   dict[str, Room]   = defaultdict(lambda: Room(doc_id=""))

# ── Auth ──────────────────────────────────────────────────────────────────────

def _decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None

def _user_color(user_id: str) -> str:
    """Couleur déterministe basée sur l'ID utilisateur."""
    COLORS = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
        "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
        "#BB8FCE", "#85C1E9",
    ]
    idx = sum(ord(c) for c in user_id) % len(COLORS)
    return COLORS[idx]

# ── Encodage varint (LEB128) pour y-protocol ─────────────────────────────────

def _write_varint(n: int) -> bytes:
    out = []
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            break
    return bytes(out)

def _read_varint(data: bytes, offset: int) -> tuple[int, int]:
    result, shift = 0, 0
    while True:
        b = data[offset]; offset += 1
        result |= (b & 0x7F) << shift
        if not (b & 0x80):
            return result, offset
        shift += 7

# ── Broadcast helpers ─────────────────────────────────────────────────────────

async def _broadcast(room: Room, message: bytes, exclude: Optional[str] = None):
    """Envoie un message binaire à tous les clients de la room sauf exclude."""
    dead = []
    for cid, client in room.clients.items():
        if cid == exclude:
            continue
        try:
            await client.ws.send(message)
        except websockets.ConnectionClosed:
            dead.append(cid)
    for cid in dead:
        await _leave_room(cid)

async def _send_presence_list(room: Room):
    """Envoie la liste JSON des utilisateurs présents à toute la room."""
    users = [
        {"user_id": c.user_id, "username": c.username, "color": c.color}
        for c in room.clients.values()
    ]
    msg = json.dumps({"type": "presence_list", "users": users}).encode()
    await _broadcast(room, msg)

# ── Gestion de la room ────────────────────────────────────────────────────────

async def _join_room(client: Client, room: Room):
    conn_id = id(client.ws)
    room.clients[str(conn_id)] = client
    log.info(f"[{client.doc_id}] +{client.username} ({len(room.clients)} users)")
    await _send_presence_list(room)

async def _leave_room(conn_id: str):
    client = _clients.pop(conn_id, None)
    if not client:
        return
    room = _rooms.get(client.doc_id)
    if room:
        room.clients.pop(conn_id, None)
        log.info(f"[{client.doc_id}] -{client.username} ({len(room.clients)} users)")
        # Notifier les autres de la déconnexion
        leave_msg = json.dumps({
            "type": "user_left",
            "user_id": client.user_id,
            "username": client.username,
        }).encode()
        await _broadcast(room, leave_msg)
        await _send_presence_list(room)
        if not room.clients:
            del _rooms[client.doc_id]

# ── Traitement des messages ───────────────────────────────────────────────────

async def _handle_yjs_message(client: Client, room: Room, data: bytes):
    """Traite les messages du protocole y-websocket et les relaie."""
    if len(data) < 1:
        return

    msg_type = data[0]

    if msg_type == MSG_SYNC:
        if len(data) < 2:
            return
        sync_type = data[1]

        if sync_type == SYNC_STEP1:
            # Client demande l'état → on lui renvoie notre snapshot (STEP2)
            # puis on lui demande son état (STEP1 en retour)
            step2 = bytes([MSG_SYNC, SYNC_STEP2]) + room.doc_state
            await client.ws.send(step2)

        elif sync_type in (SYNC_STEP2, SYNC_UPDATE):
            # Mise à jour reçue → merge dans notre snapshot et broadcast
            update_payload = data[2:]
            room.doc_state = bytearray(update_payload)  # simplifié: last-write
            await _broadcast(room, data, exclude=str(id(client.ws)))

    elif msg_type == MSG_AWARENESS:
        # Awareness = curseurs, sélections, présence fine
        client.awareness = data
        await _broadcast(room, data, exclude=str(id(client.ws)))

    elif msg_type == MSG_QUERY_AWARENESS:
        # Renvoi des awareness states de tous les autres clients
        for other in room.clients.values():
            if other.awareness and other.ws != client.ws:
                try:
                    await client.ws.send(other.awareness)
                except websockets.ConnectionClosed:
                    pass

async def _handle_json_message(client: Client, room: Room, raw: str):
    """Traite les messages JSON de présence/chat."""
    try:
        msg = json.loads(raw)
    except json.JSONDecodeError:
        return

    mtype = msg.get("type")

    if mtype == "cursor_move":
        # Curseur texte enrichi (position absolue dans le doc)
        broadcast = json.dumps({
            "type":     "cursor_move",
            "user_id":  client.user_id,
            "username": client.username,
            "color":    client.color,
            "position": msg.get("position"),
            "selection": msg.get("selection"),
        })
        await _broadcast(room, broadcast.encode(), exclude=str(id(client.ws)))

    elif mtype == "typing":
        broadcast = json.dumps({
            "type":     "typing",
            "user_id":  client.user_id,
            "username": client.username,
            "is_typing": msg.get("is_typing", False),
        })
        await _broadcast(room, broadcast.encode(), exclude=str(id(client.ws)))

    elif mtype == "ping":
        await client.ws.send(json.dumps({"type": "pong"}).encode())

# ── Handler principal ─────────────────────────────────────────────────────────

import urllib.parse

async def handler(ws: WebSocketServerProtocol):
    conn_id = str(id(ws))
    client: Optional[Client] = None

    try:
        # ── Handshake : Extraction via URL path (/ room_id) ou Query params ───
        path_parts = ws.path.split('?')
        doc_id = path_parts[0].strip('/')  # e.g. /my-doc -> my-doc
        
        query_params = {}
        if len(path_parts) > 1:
            query_params = urllib.parse.parse_qs(path_parts[1])
        
        token = query_params.get("token", [""])[0]
        username = query_params.get("username", [""])[0]

        # Si pas d'auth via URL, attendre le message JSON optionnel (fallback)
        if not token:
            try:
                raw_auth = await asyncio.wait_for(ws.recv(), timeout=5)
                if not isinstance(raw_auth, bytes):
                    auth_msg = json.loads(raw_auth)
                    token = auth_msg.get("token", "")
                    doc_id = doc_id or auth_msg.get("doc_id", "")
                    username = username or auth_msg.get("username", "")
            except (asyncio.TimeoutError, json.JSONDecodeError):
                pass

        payload = _decode_token(token)
        if not payload or payload.get("kind") != "access":
            log.warning(f"[{conn_id}] Unauthorized connection attempt")
            await ws.send(json.dumps({"type": "error", "message": "Unauthorized"}).encode())
            return

        user_id  = payload["sub"]
        username = username or f"User_{user_id[:6]}"
        color    = _user_color(user_id)

        client = Client(ws=ws, user_id=user_id, username=username,
                        color=color, doc_id=doc_id)
        _clients[conn_id] = client

        # room persistence logic
        if doc_id not in _rooms:
            _rooms[doc_id] = Room(doc_id=doc_id)
        room = _rooms[doc_id]

        log.info(f"[{doc_id}] User {username} connected")
        await ws.send(json.dumps({
            "type":     "connected",
            "user_id":  user_id,
            "username": username,
            "color":    color,
        }).encode())

        await _join_room(client, room)

        # ── Boucle principale ────────────────────────────────────────────────
        async for message in ws:
            if isinstance(message, bytes):
                await _handle_yjs_message(client, room, message)
            else:
                await _handle_json_message(client, room, message)

    except asyncio.TimeoutError:
        log.warning(f"[{conn_id}] Auth timeout")
    except websockets.ConnectionClosed:
        pass
    except Exception as e:
        log.error(f"[{conn_id}] Error: {e}", exc_info=True)
    finally:
        await _leave_room(conn_id)

# ── Entrée ────────────────────────────────────────────────────────────────────

async def main():
    log.info(f"🚀 WebSocket server started on ws://{HOST}:{PORT}")
    async with websockets.serve(handler, HOST, PORT, max_size=10 * 1024 * 1024):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
