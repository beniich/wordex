from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import asyncpg

from app.database import get_db
from app.auth import get_current_user_id
from app.models import UserOut

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class UserUpdateRequest(BaseModel):
    username:   Optional[str] = None
    avatar_url: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────────────────

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

@router.patch("/me", response_model=UserOut)
async def update_me(
    body: UserUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Update profile fields (username, avatar_url)."""
    if body.username:
        conflict = await db.fetchrow(
            "SELECT id FROM users WHERE username=$1 AND id!=$2",
            body.username, user_id
        )
        if conflict:
            raise HTTPException(400, "Username already taken")

    updated = await db.fetchrow(
        """UPDATE users SET
               username   = COALESCE($2, username),
               avatar_url = COALESCE($3, avatar_url)
           WHERE id=$1
           RETURNING id, email, username, avatar_url, provider, created_at""",
        user_id,
        body.username,
        body.avatar_url
    )
    return dict(updated)

@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: str,
    _: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Public profile lookup by ID."""
    row = await db.fetchrow(
        "SELECT id, email, username, avatar_url, provider, created_at FROM users WHERE id=$1",
        user_id
    )
    if not row:
        raise HTTPException(404, "User not found")
    return dict(row)
