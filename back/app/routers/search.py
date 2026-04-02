"""
routers/search.py — Recherche globale
  - Full-text PostgreSQL (tsvector) sur titres + contenu
  - Recherche dans les noms de fichiers
  - Résultats unifiés avec score de pertinence
  - Filtres : type, date, auteur
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.database import get_db
from app.auth import get_current_user_id

router = APIRouter()

@router.get("/")
async def search(
    workspace_id: str = Query(...),
    q: str        = Query(..., min_length=1),
    doc_type: Optional[str] = Query(None),   # note | spreadsheet | presentation
    author_id: Optional[str] = Query(None),
    limit: int    = Query(20, le=50),
    user_id: str  = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_member(db, workspace_id, user_id)

    # Normalisation de la query pour tsvector (opérateur préfixe pour la frappe partielle)
    ts_query = " & ".join(w + ":*" for w in q.strip().split() if w)

    # ── Documents ────────────────────────────────────────────────────────────
    doc_filters = "AND doc_type = $4" if doc_type else ""
    author_filter = f"AND created_by = ${'5' if doc_type else '4'}" if author_id else ""

    doc_params = [workspace_id, ts_query, limit]
    if doc_type:    doc_params.append(doc_type)
    if author_id:   doc_params.append(author_id)

    docs = await db.fetch(
        f"""SELECT
                id,
                title,
                doc_type,
                LEFT(content_text, 200) AS excerpt,
                created_by,
                updated_at,
                ts_rank(search_vec, to_tsquery('french', $2)) AS rank,
                'document' AS result_type
            FROM documents
            WHERE workspace_id = $1
              AND is_deleted = false
              AND search_vec @@ to_tsquery('french', $2)
              {doc_filters}
              {author_filter}
            ORDER BY rank DESC
            LIMIT $3""",
        *doc_params,
    )

    # ── Fichiers ─────────────────────────────────────────────────────────────
    file_params = [workspace_id, f"%{q}%", limit]
    files = await db.fetch(
        """SELECT
               id,
               filename AS title,
               mime_type AS doc_type,
               NULL AS excerpt,
               uploaded_by AS created_by,
               created_at AS updated_at,
               0.5 AS rank,
               'file' AS result_type
           FROM files
           WHERE workspace_id = $1
             AND LOWER(filename) LIKE LOWER($2)
           ORDER BY created_at DESC
           LIMIT $3""",
        *file_params,
    )

    # ── Fusion + tri global ───────────────────────────────────────────────────
    results = [dict(r) for r in docs] + [dict(r) for r in files]
    results.sort(key=lambda r: r["rank"], reverse=True)

    return {
        "query": q,
        "total": len(results),
        "results": results[:limit],
    }

@router.get("/recent")
async def recent_documents(
    workspace_id: str = Query(...),
    limit: int        = Query(10, le=30),
    user_id: str      = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Documents récemment modifiés par l'utilisateur courant."""
    await _require_member(db, workspace_id, user_id)
    rows = await db.fetch(
        """SELECT id, title, doc_type, updated_at
           FROM documents
           WHERE workspace_id = $1
             AND (created_by = $2 OR updated_by = $2)
             AND is_deleted = false
           ORDER BY updated_at DESC
           LIMIT $3""",
        workspace_id, user_id, limit,
    )
    return [dict(r) for r in rows]

# ── Helper ────────────────────────────────────────────────────────────────────

async def _require_member(db, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id,
    )
    if not row:
        from fastapi import HTTPException
        raise HTTPException(403, "Accès refusé")
