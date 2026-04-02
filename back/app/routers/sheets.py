from fastapi import APIRouter, Depends, HTTPException
import asyncpg
from typing import Dict, Any

from app.database import get_db
from app.auth import get_current_user_id
from app.routers.documents import update_document, get_document, list_versions, restore_version
from app.models import DocumentUpdate

router = APIRouter()

@router.get("/{id}")
async def get_sheet(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    """Retrieve a spreadsheet document."""
    doc = await get_document(id, user_id=user_id, db=db)
    if doc["doc_type"] != "spreadsheet":
        raise HTTPException(400, "Document is not a spreadsheet")
    
    # Return in the format expected by the frontend
    content = doc["content"] or {"cells": {}, "metadata": {"version": 1}}
    return content

from app.routers.notifications import push_to_workspace

@router.put("/{id}")
async def update_sheet(
    id: str,
    body: Dict[str, Any],
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    """Update a spreadsheet cells and metadata."""
    update_data = DocumentUpdate(content=body)
    updated_doc = await update_document(id, update_data, user_id=user_id, db=db)
    
    # Trigger real-time broadcast to workspace
    ws_id = updated_doc.get("workspace_id")
    if ws_id:
        await push_to_workspace(db, str(ws_id), {
            "type": "sheet.updated",
            "data": {
                "document_id": id,
                "actor_id": user_id,
                "updated_at": updated_doc.get("updated_at")
            }
        }, exclude_user=user_id)

    return {"status": "updated", "version": await db.fetchval("SELECT count(*) FROM document_versions WHERE document_id=$1", id)}

@router.get("/{id}/versions")
async def get_sheet_versions(
    id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    return await list_versions(id, user_id=user_id, db=db)

@router.post("/{id}/restore/{version_id}")
async def restore_sheet_version(
    id: str,
    version_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    return await restore_version(id, version_id, user_id=user_id, db=db)
