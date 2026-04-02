from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, EmailStr
from typing import Optional
import asyncpg

from app.database import get_db
from app.auth import (
    get_current_user_id, hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)
from app.models import UserOut, TokenResponse

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserOut, status_code=201)
async def register(
    body: RegisterRequest,
    db: asyncpg.Connection = Depends(get_db),
):
    async with db.transaction():
        existing = await db.fetchrow(
            "SELECT id FROM users WHERE email=$1 OR username=$2",
            body.email, body.username
        )
        if existing:
            raise HTTPException(400, "Email or username already taken")

        hashed = hash_password(body.password)
        user = await db.fetchrow(
            """INSERT INTO users (email, username, hashed_pw)
               VALUES ($1, $2, $3)
               RETURNING id, email, username, avatar_url, provider, created_at""",
            body.email, body.username, hashed
        )
    return dict(user)

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: asyncpg.Connection = Depends(get_db),
):
    user = await db.fetchrow(
        "SELECT id, hashed_pw FROM users WHERE email=$1 AND provider='local'",
        body.email
    )
    if not user or not verify_password(body.password, user["hashed_pw"]):
        raise HTTPException(401, "Invalid credentials")

    uid = str(user["id"])
    return {
        "access_token":  create_access_token(uid),
        "refresh_token": create_refresh_token(uid),
        "token_type":    "bearer"
    }

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    """Issue new access + refresh tokens from a valid refresh token."""
    payload = decode_token(body.refresh_token)
    if payload.get("kind") != "refresh":
        raise HTTPException(401, "Refresh token required")
    uid = payload["sub"]
    return {
        "access_token":  create_access_token(uid),
        "refresh_token": create_refresh_token(uid),
        "token_type":    "bearer"
    }

@router.post("/logout", status_code=204)
async def logout(user_id: str = Depends(get_current_user_id)):
    """
    Client-side logout — instruct client to discard tokens.
    Server-side token revocation requires a Redis deny-list (future iteration).
    """
    return  # 204 No Content

@router.get("/me", response_model=UserOut)
async def get_me(
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT id, email, username, avatar_url, provider, created_at FROM users WHERE id=$1",
        user_id
    )
    if not row:
        raise HTTPException(404, "User not found")
    return dict(row)

@router.put("/me/password", status_code=204)
async def change_password(
    body: PasswordChangeRequest,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT hashed_pw FROM users WHERE id=$1", user_id
    )
    if not row or not verify_password(body.current_password, row["hashed_pw"]):
        raise HTTPException(400, "Current password is incorrect")

    new_hashed = hash_password(body.new_password)
    await db.execute(
        "UPDATE users SET hashed_pw=$2 WHERE id=$1", user_id, new_hashed
    )
@router.get("/search", response_model=list[UserOut])
async def search_users(
    q: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Search users by name or email for collaboration."""
    rows = await db.fetch(
        """SELECT id, email, username, avatar_url, provider, created_at 
           FROM users 
           WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 
           LIMIT 10""",
        f"%{q}%", user_id
    )
    return [dict(r) for r in rows]
