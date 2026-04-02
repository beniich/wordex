from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Optional
import asyncpg
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.database import get_db
from app.auth import get_current_user_id
from app.services.event_bus import event_bus
from app.models import NotificationCreate

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    document_id: uuid.UUID
    content: str
    parent_id: Optional[uuid.UUID] = None
    anchor_from: Optional[int] = None
    anchor_to: Optional[int] = None

class CommentOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    author_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    content: str
    anchor_from: Optional[int]
    anchor_to: Optional[int]
    resolved: bool
    created_at: datetime

class CommentResolve(BaseModel):
    resolved: bool = True

# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[CommentOut])
async def list_comments(
    document_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """SELECT id, document_id, author_id, parent_id, content, anchor_from, anchor_to,
                  resolved, created_at
           FROM comments
           WHERE document_id=$1 AND resolved=false
           ORDER BY created_at ASC""",
        document_id
    )
    return [dict(r) for r in rows]

@router.post("/", response_model=CommentOut, status_code=201)
async def create_comment(
    body: CommentCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        """INSERT INTO comments
               (document_id, author_id, parent_id, content, anchor_from, anchor_to)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, document_id, author_id, parent_id, content, anchor_from, anchor_to,
                     resolved, created_at""",
        str(body.document_id), user_id, 
        str(body.parent_id) if body.parent_id else None,
        body.content,
        body.anchor_from, body.anchor_to
    )
    
    # Broadcast event
    await event_bus.publish("comment.created", {
        "comment_id": str(row["id"]),
        "document_id": str(row["document_id"]),
        "author_id": user_id,
        "content": row["content"]
    }, author_id=user_id)
    
    return dict(row)

@router.patch("/{comment_id}", response_model=CommentOut)
async def resolve_comment(
    comment_id: str,
    body: CommentResolve,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT author_id FROM comments WHERE id=$1", comment_id
    )
    if not row:
        raise HTTPException(404, "Comment not found")
    if str(row["author_id"]) != user_id:
        raise HTTPException(403, "Only the comment author can resolve it")

    updated = await db.fetchrow(
        """UPDATE comments SET resolved=$2
           WHERE id=$1
           RETURNING id, document_id, author_id, content, anchor_from, anchor_to,
                     resolved, created_at""",
        comment_id, body.resolved
    )

    # Broadcast event
    event_type = "comment.resolved" if body.resolved else "comment.reopened"
    await event_bus.publish(event_type, {
        "comment_id": comment_id,
        "document_id": str(updated["document_id"]),
        "author_id": user_id
    }, author_id=user_id)

    return dict(updated)

@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT author_id FROM comments WHERE id=$1", comment_id
    )
    if not row:
        raise HTTPException(404, "Comment not found")
    if str(row["author_id"]) != user_id:
        raise HTTPException(403, "Only the author can delete their comment")
    await db.execute("DELETE FROM comments WHERE id=$1", comment_id)

    # Broadcast event
    await event_bus.publish("comment.deleted", {
        "comment_id": comment_id,
        "document_id": str(row["document_id"]) if "document_id" in row else None,
        "author_id": user_id
    }, author_id=user_id)
