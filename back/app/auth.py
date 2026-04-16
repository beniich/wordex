import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import get_db_pool

SECRET_KEY     = os.getenv("JWT_SECRET", "change-me-in-production-please")
ALGORITHM      = "HS256"
ACCESS_EXPIRE  = int(os.getenv("JWT_ACCESS_MINUTES",  "30"))
REFRESH_EXPIRE = int(os.getenv("JWT_REFRESH_DAYS",    "30"))

bearer_scheme = HTTPBearer()

# ── Passwords ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

# ── JWT ───────────────────────────────────────────────────────────────────────

def _create_token(sub: str, kind: str, expires_delta: timedelta) -> str:
    payload = {
        "sub":  sub,
        "kind": kind,
        "jti":  str(uuid.uuid4()),
        "exp":  datetime.now(timezone.utc) + expires_delta,
        "iat":  datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(user_id: str) -> str:
    return _create_token(user_id, "access", timedelta(minutes=ACCESS_EXPIRE))

def create_refresh_token(user_id: str) -> str:
    return _create_token(user_id, "refresh", timedelta(days=REFRESH_EXPIRE))

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Dependency ────────────────────────────────────────────────────────────────

async def get_current_user_id(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    payload = decode_token(creds.credentials)
    if payload.get("kind") != "access":
        raise HTTPException(status_code=401, detail="Access token required")
    return payload["sub"]

async def get_current_user(
    user_id: str = Depends(get_current_user_id)
) -> dict:
    pool = get_db_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database non initialisée")
    
    async with pool.acquire() as conn:
        user = await conn.fetchrow(
            "SELECT id, email, username, role, provider, created_at FROM users WHERE id = $1", 
            user_id
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        # Ensure we return a dict with 'sub' and 'email' for compatibility with older code
        u = dict(user)
        u["sub"] = str(u["id"])
        return u



async def get_current_org_id(user_id: str = Depends(get_current_user_id)) -> str:
    """Récupère un ID d'organisation isolé (actuellement basé sur le user_id)."""
    pool = get_db_pool()
    if not pool:
        raise HTTPException(status_code=500, detail="Database non initialisée")
    
    async with pool.acquire() as conn:
        # Prisma was deprecated and removed. We simulate the org isolation by using the user_id
        # until the workspaces / org logic is properly extracted.
        user = await conn.fetchrow("SELECT id FROM users WHERE id = $1", user_id)
        if not user:
            raise HTTPException(status_code=403, detail="Utilisateur introuvable")
        return str(user["id"])
