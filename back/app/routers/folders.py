"""
routers/folders.py — Arborescence de dossiers
  - Dossiers imbriqués (parent_id récursif)
  - Déplacement de documents/dossiers
  - Breadcrumb
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import asyncpg

from app.database import get_db
from app.auth import get_current_user_id

router = APIRouter()

# ── Modèles ───────────────────────────────────────────────────────────────────

class FolderCreate(BaseModel):
    workspace_id: str
    name: str
    parent_id: Optional[str] = None

class FolderRename(BaseModel):
    name: str

class MoveItem(BaseModel):
    target_parent_id: Optional[str] = None   # None = racine

# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/", status_code=201)
async def create_folder(
    body: FolderCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_write(db, body.workspace_id, user_id)
    row = await db.fetchrow(
        """INSERT INTO folders (workspace_id, name, parent_id, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id, workspace_id, name, parent_id, created_by, created_at""",
        body.workspace_id, body.name,
        body.parent_id, user_id,
    )
    return dict(row)

@router.get("/tree")
async def get_tree(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Retourne l'arbre complet (dossiers + documents) en une seule requête récursive."""
    await _require_read(db, workspace_id, user_id)

    # Dossiers via CTE récursive
    folders = await db.fetch(
        """WITH RECURSIVE tree AS (
               SELECT id, name, parent_id, 0 AS depth
               FROM folders
               WHERE workspace_id = $1 AND parent_id IS NULL AND is_deleted = false
             UNION ALL
               SELECT f.id, f.name, f.parent_id, t.depth + 1
               FROM folders f
               JOIN tree t ON f.parent_id = t.id
               WHERE f.is_deleted = false
           )
           SELECT * FROM tree ORDER BY depth, name""",
        workspace_id,
    )

    # Documents à la racine et dans chaque dossier
    docs = await db.fetch(
        """SELECT id, title, doc_type, parent_id AS folder_id, updated_at
           FROM documents
           WHERE workspace_id = $1 AND is_deleted = false
           ORDER BY updated_at DESC""",
        workspace_id,
    )

    return {
        "folders": [dict(f) for f in folders],
        "documents": [dict(d) for d in docs],
    }

@router.patch("/{folder_id}/rename")
async def rename_folder(
    folder_id: str,
    body: FolderRename,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    folder = await _get_folder(db, folder_id)
    await _require_write(db, str(folder["workspace_id"]), user_id)
    row = await db.fetchrow(
        "UPDATE folders SET name=$2 WHERE id=$1 RETURNING id, name, parent_id",
        folder_id, body.name,
    )
    return dict(row)

@router.patch("/{folder_id}/move")
async def move_folder(
    folder_id: str,
    body: MoveItem,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    folder = await _get_folder(db, folder_id)
    await _require_write(db, str(folder["workspace_id"]), user_id)

    # Empêcher les cycles (ne pas déplacer dans un descendant de soi-même)
    if body.target_parent_id:
        is_descendant = await db.fetchval(
            """WITH RECURSIVE sub AS (
                   SELECT id FROM folders WHERE id = $1
                 UNION ALL
                   SELECT f.id FROM folders f JOIN sub s ON f.parent_id = s.id
               )
               SELECT EXISTS(SELECT 1 FROM sub WHERE id = $2)""",
            folder_id, body.target_parent_id,
        )
        if is_descendant:
            raise HTTPException(400, "Déplacement circulaire interdit")

    await db.execute(
        "UPDATE folders SET parent_id=$2 WHERE id=$1",
        folder_id, body.target_parent_id,
    )
    return {"ok": True}

@router.patch("/documents/{doc_id}/move")
async def move_document(
    doc_id: str,
    body: MoveItem,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    doc = await db.fetchrow(
        "SELECT workspace_id FROM documents WHERE id=$1 AND is_deleted=false", doc_id
    )
    if not doc:
        raise HTTPException(404, "Document introuvable")
    await _require_write(db, str(doc["workspace_id"]), user_id)
    await db.execute(
        "UPDATE documents SET parent_id=$2, updated_at=now() WHERE id=$1",
        doc_id, body.target_parent_id,
    )
    return {"ok": True}

@router.delete("/{folder_id}", status_code=204)
async def delete_folder(
    folder_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    folder = await _get_folder(db, folder_id)
    await _require_write(db, str(folder["workspace_id"]), user_id)
    # Soft-delete récursif via CTE
    await db.execute(
        """WITH RECURSIVE sub AS (
               SELECT id FROM folders WHERE id = $1
             UNION ALL
               SELECT f.id FROM folders f JOIN sub s ON f.parent_id = s.id
           )
           UPDATE folders SET is_deleted=true WHERE id IN (SELECT id FROM sub)""",
        folder_id,
    )

@router.get("/{folder_id}/breadcrumb")
async def breadcrumb(
    folder_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Remonte la chaîne parent → racine."""
    rows = await db.fetch(
        """WITH RECURSIVE crumb AS (
               SELECT id, name, parent_id, 0 AS pos
               FROM folders WHERE id = $1
             UNION ALL
               SELECT f.id, f.name, f.parent_id, c.pos + 1
               FROM folders f JOIN crumb c ON f.id = c.parent_id
           )
           SELECT id, name FROM crumb ORDER BY pos DESC""",
        folder_id,
    )
    return [dict(r) for r in rows]

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_folder(db, folder_id: str):
    row = await db.fetchrow(
        "SELECT id, workspace_id FROM folders WHERE id=$1 AND is_deleted=false", folder_id
    )
    if not row:
        raise HTTPException(404, "Dossier introuvable")
    return row

async def _require_read(db, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id,
    )
    if not row:
        raise HTTPException(403, "Accès refusé")

async def _require_write(db, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id,
    )
    if not row:
        raise HTTPException(403, "Accès refusé")
    if row["role"] == "viewer":
        raise HTTPException(403, "Accès en lecture seule")
