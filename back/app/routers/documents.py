from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.auth import get_current_user_id
from app.models import (
    DocumentOut, DocumentDetailOut, DocumentVersionOut, DocumentVersionDetailOut,
    DocumentSearchOut, RoleOut, DocumentCreate, DocumentUpdate
)
from app.services.event_bus import event_bus
import json

router = APIRouter()

# ── CRUD ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=DocumentOut, status_code=201)
async def create_document(
    body: DocumentCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_workspace_access(db, str(body.workspace_id), user_id, write=True)

    row = await db.fetchrow(
        """INSERT INTO documents
               (workspace_id, parent_id, title, doc_type, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $5)
           RETURNING id, workspace_id, parent_id, title, doc_type,
                     created_by, updated_by, created_at, updated_at""",
        str(body.workspace_id), str(body.parent_id) if body.parent_id else None,
        body.title, body.doc_type, user_id
    )
    res = dict(row)
    
    # Task: Notification and Webhook
    await event_bus.publish(
        "document.created", 
        payload={"id": str(res["id"]), "title": res["title"]},
        workspace_id=str(res["workspace_id"]),
        user_id=user_id
    )
    return res

@router.get("/recent", response_model=list[DocumentOut])
async def list_recent_documents(
    limit: int = Query(10, ge=1, le=50),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """SELECT d.id, d.workspace_id, d.parent_id, d.title, d.doc_type,
                  d.created_by, d.updated_by, d.created_at, d.updated_at
           FROM documents d
           JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
           WHERE wm.user_id = $1 AND d.is_deleted = false
           ORDER BY d.updated_at DESC
           LIMIT $2""",
        user_id, limit
    )
    return [dict(r) for r in rows]

@router.get("/", response_model=list[DocumentOut])
async def list_documents(
    workspace_id: str = Query(...),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_workspace_access(db, workspace_id, user_id)
    rows = await db.fetch(
        """SELECT id, workspace_id, parent_id, title, doc_type,
                  created_by, updated_by, created_at, updated_at
           FROM documents
           WHERE workspace_id=$1 AND is_deleted=false
           ORDER BY updated_at DESC""",
        workspace_id
    )
    return [dict(r) for r in rows]

@router.get("/search", response_model=list[DocumentOut])
async def search_documents(
    workspace_id: str = Query(...),
    q: str = Query(..., min_length=2),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_workspace_access(db, workspace_id, user_id)
    rows = await db.fetch(
        """SELECT id, workspace_id, parent_id, title, doc_type,
                  created_by, updated_by, created_at, updated_at,
                  ts_rank(search_vec, query) AS rank
           FROM documents, to_tsquery('french', $2) query
           WHERE workspace_id=$1
             AND is_deleted=false
             AND search_vec @@ query
           ORDER BY rank DESC
           LIMIT 20""",
        workspace_id, q.replace(" ", " & ")
    )
    return [dict(r) for r in rows]

@router.get("/{doc_id}", response_model=DocumentOut)
async def get_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id)
    return dict(row)

@router.patch("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: str,
    body: DocumentUpdate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id, write=True)

    async with db.transaction():
        # Save version snapshot before overwriting
        version_count = await db.fetchval(
            "SELECT count(*) FROM document_versions WHERE document_id=$1", doc_id
        )
        await db.execute(
            """INSERT INTO document_versions (document_id, content, saved_by, version)
               VALUES ($1, $2, $3, $4)""",
            doc_id, row["content"], user_id, version_count + 1
        )

        updated = await db.fetchrow(
            """UPDATE documents SET
                   title        = COALESCE($2, title),
                   content      = COALESCE($3, content),
                   content_text = COALESCE($4, content_text),
                   updated_by   = $5,
                   updated_at   = now()
               WHERE id=$1
               RETURNING id, workspace_id, parent_id, title, doc_type,
                         created_by, updated_by, created_at, updated_at""",
            doc_id,
            body.title, body.content, body.content_text,
            user_id
        )
    
    res = dict(updated)
    await event_bus.publish(
        "document.updated",
        payload={"id": str(res["id"]), "title": res["title"]},
        workspace_id=str(res["workspace_id"]),
        user_id=user_id
    )
    return res

@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id, write=True)
    await db.execute(
        "UPDATE documents SET is_deleted=true WHERE id=$1", doc_id
    )
    
    await event_bus.publish(
        "document.deleted",
        payload={"id": doc_id},
        workspace_id=str(row["workspace_id"]),
        user_id=user_id
    )

# ── Versions ──────────────────────────────────────────────────────────────────

@router.get("/{doc_id}/versions", response_model=list[DocumentVersionOut])
async def list_versions(
    doc_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id)
    rows = await db.fetch(
        """SELECT v.id, v.document_id, v.version, v.saved_by, v.created_at, u.username AS saved_by_name
           FROM document_versions v
           LEFT JOIN users u ON u.id = v.saved_by
           WHERE v.document_id=$1
           ORDER BY v.version DESC""",
        doc_id
    )
    return [dict(r) for r in rows]

@router.get("/{doc_id}/versions/{version_id}", response_model=DocumentVersionDetailOut)
async def get_version(
    doc_id: str,
    version_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id)
    v = await db.fetchrow(
        """SELECT v.id, v.document_id, v.version, v.saved_by, v.created_at, v.content, u.username AS saved_by_name
           FROM document_versions v
           LEFT JOIN users u ON u.id = v.saved_by
           WHERE v.id=$1 AND v.document_id=$2""",
        version_id, doc_id
    )
    if not v:
        raise HTTPException(404, "Version not found")
    res = dict(v)
    import json
    # Convert JSON content to string for easy text diff comparison
    res["content_text"] = json.dumps(res["content"]) if res["content"] else ""
    return res

@router.post("/{doc_id}/versions/{version_id}/restore", response_model=DocumentOut)
async def restore_version(
    doc_id: str,
    version_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _get_doc_or_404(db, doc_id)
    await _require_workspace_access(db, str(row["workspace_id"]), user_id, write=True)

    v = await db.fetchrow(
        "SELECT content FROM document_versions WHERE id=$1 AND document_id=$2",
        version_id, doc_id
    )
    if not v:
        raise HTTPException(404, "Version not found")

    restored = await db.fetchrow(
        """UPDATE documents SET content=$2, updated_by=$3, updated_at=now()
           WHERE id=$1
           RETURNING id, workspace_id, parent_id, title, doc_type,
                     created_by, updated_by, created_at, updated_at""",
        doc_id, v["content"], user_id
    )
    return dict(restored)

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_doc_or_404(db, doc_id: str):
    row = await db.fetchrow(
        """SELECT id, workspace_id, parent_id, title, doc_type, content,
                  created_by, updated_by, created_at, updated_at
           FROM documents WHERE id=$1 AND is_deleted=false""",
        doc_id
    )
    if not row:
        raise HTTPException(404, "Document not found")
    return row

async def _require_workspace_access(db, workspace_id: str, user_id: str, write=False):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(403, "Access denied")
    if write and row["role"] == "viewer":
        raise HTTPException(403, "Read-only access")
