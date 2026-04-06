import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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

async def get_current_org_id(user_id: str = Depends(get_current_user_id)) -> str:
    """Récupère l'organisation_id de l'utilisateur actuel"""
    from prisma import Prisma
    db = Prisma()
    await db.connect()
    try:
        user = await db.user.find_unique(where={"id": user_id})
        if not user or not user.organisation_id:
            raise HTTPException(status_code=403, detail="L'utilisateur n'appartient à aucune organisation")
        return user.organisation_id
    finally:
        await db.disconnect()
