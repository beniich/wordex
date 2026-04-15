"""
routers/notifications.py — Notifications in-app
  - Création de notifications (appelée par d'autres routers)
  - Liste + marquage lu
  - SSE (Server-Sent Events) pour le push temps réel
  - Types : mention, share, comment, version_restore, member_added
"""
import asyncio
import json
import uuid
from datetime import datetime
from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.database import get_db
from app.auth import get_current_user_id
from app.models import NotificationCreate, NotificationOut

router = APIRouter()

# ── SSE bus (en mémoire — remplacer par Redis Pub/Sub en prod multi-serveur) ──
_sse_queues: dict[str, list[asyncio.Queue]] = {}   # user_id → [Queue, ...]

async def _push_to_user(user_id: str, payload: dict):
    """Envoie un événement SSE à toutes les connexions d'un utilisateur."""
    if user_id in _sse_queues:
        for q in _sse_queues[user_id]:
            await q.put(payload)

async def push_to_workspace(db: asyncpg.Connection, workspace_id: str, payload: dict, exclude_user: Optional[str] = None):
    """Broadcaste un événement à tous les membres connectés d'un workspace."""
    # Retrouver les membres du workspace
    members = await db.fetch("SELECT user_id FROM workspace_members WHERE workspace_id = $1", workspace_id)
    for member in members:
        uid = str(member["user_id"])
        if uid != exclude_user:
            await _push_to_user(uid, payload)

# ── Modèles ───────────────────────────────────────────────────────────────────
# (Les modèles NotificationCreate et NotificationOut sont importés de app.models)

# ── Fonction utilitaire (appelée par d'autres routers) ───────────────────────

async def create_notification(db: asyncpg.Connection, data: NotificationCreate) -> dict:
    if data.recipient_id == data.actor_id:
        return {}   # pas de notif à soi-même

    row = await db.fetchrow(
        """INSERT INTO notifications
               (recipient_id, actor_id, notif_type, entity_type, entity_id, entity_title, message)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, recipient_id, actor_id, notif_type,
                     entity_type, entity_id, entity_title, message,
                     is_read, created_at""",
        data.recipient_id, data.actor_id, data.notif_type,
        data.entity_type, data.entity_id,
        data.entity_title, data.message,
    )
    notif = dict(row)
    notif["created_at"] = notif["created_at"].isoformat()

    # Push SSE temps réel
    await _push_to_user(data.recipient_id, {"type": "notification", "data": notif})
    return notif

async def handle_notification_event(event_type: str, payload: dict):
    """Callback for the event bus, creating in-app notifications if needed."""
    from app.database import get_db_pool
    pool = get_db_pool()
    if not pool:
        return

    async with pool.acquire() as db:
        if event_type == "comment.created":
            doc_id = payload.get("document_id")
            author_id = payload.get("author_id")
            if not doc_id or not author_id:
                return
            
            # Notify document owner
            doc = await db.fetchrow("SELECT created_by, title FROM documents WHERE id=$1", doc_id)
            if doc and doc["created_by"] and str(doc["created_by"]) != author_id:
                notif_data = NotificationCreate(
                    recipient_id=uuid.UUID(str(doc["created_by"])),
                    actor_id=uuid.UUID(author_id),
                    notif_type="comment",
                    entity_type="document",
                    entity_id=uuid.UUID(doc_id),
                    entity_title=doc["title"],
                    message="New comment on your document"
                )
                await create_notification(db, notif_data)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/stream")
async def sse_stream(
    request: Request,
    user_id: str = Depends(get_current_user_id),
):
    """
    Server-Sent Events — le client s'abonne une fois et reçoit les notifs en push.
    Usage côté client :
        const es = new EventSource("/api/notifications/stream?token=...");
        es.onmessage = (e) => console.log(JSON.parse(e.data));
    """
    queue: asyncio.Queue = asyncio.Queue()
    _sse_queues.setdefault(user_id, []).append(queue)

    async def generator():
        try:
            yield f"data: {json.dumps({'type': 'connected'})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": heartbeat\n\n"   # garde la connexion vivante
        finally:
            _sse_queues[user_id].remove(queue)
            if not _sse_queues[user_id]:
                del _sse_queues[user_id]

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

@router.get("/", response_model=list[NotificationOut])
async def list_notifications(
    unread_only: bool = Query(False),
    limit: int        = Query(30, le=100),
    user_id: str      = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    filter_sql = "AND is_read = false" if unread_only else ""
    rows = await db.fetch(
        f"""SELECT n.id, n.recipient_id, n.actor_id, n.notif_type, n.entity_type, n.entity_id,
                   n.entity_title, n.message, n.is_read, n.created_at,
                   u.username AS actor_name, u.avatar_url AS actor_avatar
            FROM notifications n
            LEFT JOIN users u ON u.id = n.actor_id::uuid
            WHERE n.recipient_id = $1 {filter_sql}
            ORDER BY n.created_at DESC
            LIMIT $2""",
        user_id, limit,
    )
    return [dict(r) for r in rows]

@router.get("/unread-count")
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    count = await db.fetchval(
        "SELECT COUNT(*) FROM notifications WHERE recipient_id=$1 AND is_read=false",
        user_id,
    )
    return {"count": count}

@router.patch("/{notif_id}/read", status_code=204)
async def mark_read(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute(
        "UPDATE notifications SET is_read=true WHERE id=$1 AND recipient_id=$2",
        notif_id, user_id,
    )

@router.patch("/read-all", status_code=204)
async def mark_all_read(
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute(
        "UPDATE notifications SET is_read=true WHERE recipient_id=$1", user_id
    )

@router.delete("/{notif_id}", status_code=204)
async def delete_notification(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await db.execute(
        "DELETE FROM notifications WHERE id=$1 AND recipient_id=$2",
        notif_id, user_id,
    )
