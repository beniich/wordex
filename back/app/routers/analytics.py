from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional, Dict, Any
import asyncpg
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user_id

router = APIRouter()

async def _require_workspace_access(db: asyncpg.Connection, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(403, "Access denied")
    return row

@router.get("/{workspace_id}")
async def get_analytics(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    # Locate analytics document for this workspace
    doc = await db.fetchrow(
        "SELECT id, content FROM documents WHERE workspace_id=$1 AND doc_type='analytics' AND is_deleted=false LIMIT 1",
        workspace_id
    )
    
    # If the user has saved content we return it
    if doc and doc["content"]:
        return {"data": doc["content"]}
        
    # Default fallback content for the dashboard
    return {
        "data": {
            "valuation": 0,
            "irr": 0,
            "yield": 0,
            "series": [0, 0, 0, 0, 0, 0]
        }
    }

@router.put("/{workspace_id}")
async def save_analytics(
    workspace_id: str,
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    
    doc = await db.fetchrow(
        "SELECT id FROM documents WHERE workspace_id=$1 AND doc_type='analytics' AND is_deleted=false LIMIT 1",
        workspace_id
    )
    
    if not doc:
        # Create it if it doesn't exist
        row = await db.fetchrow(
            """INSERT INTO documents (workspace_id, title, doc_type, content, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $5) RETURNING id""",
            workspace_id, "Strategic Portfolio Insights", "analytics", payload, user_id
        )
        return {"status": "created", "id": str(row["id"])}
    else:
        # Update it
        await db.execute(
            """UPDATE documents SET content=$2, updated_by=$3, updated_at=now()
               WHERE id=$1""",
            doc["id"], payload, user_id
        )
        return {"status": "updated", "id": str(doc["id"])}

# ── Analytics Variables ───────────────────────────────────────────────────────

@router.get("/{workspace_id}/variables")
async def get_analytics_variables(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    rows = await db.fetch(
        "SELECT id, kpi_name, source_doc, cell_range, aggregation FROM analytics_variables WHERE workspace_id=$1",
        workspace_id
    )
    return {"variables": [dict(r) for r in rows]}

@router.post("/{workspace_id}/variables")
async def create_analytics_variable(
    workspace_id: str,
    payload: Dict[str, Any],
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    await _require_workspace_access(db, workspace_id, user_id)
    row = await db.fetchrow(
        """INSERT INTO analytics_variables (workspace_id, kpi_name, source_doc, cell_range, aggregation)
           VALUES ($1, $2, $3, $4, $5) RETURNING id""",
        workspace_id, payload.get("kpi_name"), payload.get("source_doc"), 
        payload.get("cell_range"), payload.get("aggregation", "sum")
    )
    return {"id": str(row["id"])}
