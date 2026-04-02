from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import asyncpg
import io

from app.database import get_db
from app.auth import get_current_user_id

router = APIRouter()

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_doc_content(db: asyncpg.Connection, doc_id: str, user_id: str):
    """Fetch doc and verify access."""
    row = await db.fetchrow(
        """SELECT d.id, d.title, d.content_text, d.workspace_id
           FROM documents d
           WHERE d.id=$1 AND d.is_deleted=false""",
        doc_id
    )
    if not row:
        raise HTTPException(404, "Document not found")
    # Check workspace membership
    member = await db.fetchrow(
        "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        str(row["workspace_id"]), user_id
    )
    if not member:
        raise HTTPException(403, "Access denied")
    return row

# ── Routes ────────────────────────────────────────────────────────────────────

from typing import Literal
from app.services.export_service import ExportService

@router.get("/{doc_id}/{format}")
async def export_document(
    doc_id: str,
    format: Literal["pdf", "docx", "pptx", "markdown", "md"],
    template: str = "professional",
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """
    Unified endpoint for all document exports.
    """
    row = await _get_doc_content(db, doc_id, user_id)
    title = row["title"] or "Untitled"
    
    # We rely on content_text containing the JSON for tiptap.
    # If the frontend stores JSON in 'content', we need to fetch 'content' from DB.
    # In Wordex, content is stored in the 'content' column as JSONB.
    # Let me actually modify _get_doc_content to fetch doc.content instead of just content_text.
    
    # The actual data fetch
    full_row = await db.fetchrow(
        "SELECT content, content_text FROM documents WHERE id=$1", doc_id
    )
    import json
    content_json_str = json.dumps(full_row["content"]) if full_row["content"] else "{}"
    content_text = full_row["content_text"] or ""

    if format == "pdf":
        file_bytes = ExportService.generate_pdf(title, content_json_str, template)
        media_type = "application/pdf"
        ext = "pdf"
    elif format == "docx":
        file_bytes = ExportService.generate_docx(title, content_json_str)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ext = "docx"
    elif format == "pptx":
        file_bytes = ExportService.generate_pptx(title, content_json_str)
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ext = "pptx"
    elif format in ("markdown", "md"):
        md = f"# {title}\n\n{content_text}"
        file_bytes = md.encode("utf-8")
        media_type = "text/markdown"
        ext = "md"
    else:
        raise HTTPException(400, "Unsupported format")

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{title}.{ext}"'}
    )
