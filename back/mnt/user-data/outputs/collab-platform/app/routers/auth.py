from fastapi import APIRouter, Depends, HTTPException
import asyncpg

from app.database import get_db
from app.models import RegisterRequest, LoginRequest, TokenResponse
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token
)

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: asyncpg.Connection = Depends(get_db)):
    existing = await db.fetchrow(
        "SELECT id FROM users WHERE email=$1 OR username=$2",
        body.email, body.username
    )
    if existing:
        raise HTTPException(400, "Email or username already taken")

    user = await db.fetchrow(
        """INSERT INTO users (email, username, hashed_pw)
           VALUES ($1, $2, $3) RETURNING id""",
        body.email, body.username, hash_password(body.password)
    )
    uid = str(user["id"])
    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: asyncpg.Connection = Depends(get_db)):
    user = await db.fetchrow(
        "SELECT id, hashed_pw FROM users WHERE email=$1", body.email
    )
    if not user or not verify_password(body.password, user["hashed_pw"]):
        raise HTTPException(401, "Invalid credentials")

    uid = str(user["id"])
    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(refresh_token: str, db: asyncpg.Connection = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("kind") != "refresh":
        raise HTTPException(401, "Refresh token required")

    uid = payload["sub"]
    user = await db.fetchrow("SELECT id FROM users WHERE id=$1", uid)
    if not user:
        raise HTTPException(401, "User not found")

    return TokenResponse(
        access_token=create_access_token(uid),
        refresh_token=create_refresh_token(uid),
    )
