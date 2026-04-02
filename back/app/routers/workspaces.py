from fastapi import APIRouter, Depends, HTTPException
import asyncpg

from app.database import get_db
from app.auth import get_current_user_id
from app.models import WorkspaceCreate, WorkspaceOut, MemberAdd

router = APIRouter()

@router.post("/", response_model=WorkspaceOut, status_code=201)
async def create_workspace(
    body: WorkspaceCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    async with db.transaction():
        existing = await db.fetchrow("SELECT id FROM workspaces WHERE slug=$1", body.slug)
        if existing:
            raise HTTPException(400, "Slug already used")

        ws = await db.fetchrow(
            """INSERT INTO workspaces (name, slug, description, icon, color, owner_id)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING *""",
            body.name, body.slug, body.description, body.icon, body.color, user_id
        )
        # Owner gets 'owner' role in members table
        await db.execute(
            """INSERT INTO workspace_members (workspace_id, user_id, role)
               VALUES ($1, $2, 'owner')""",
            ws["id"], user_id
        )
    return dict(ws)

@router.get("/", response_model=list[WorkspaceOut])
async def list_workspaces(
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    rows = await db.fetch(
        """SELECT w.* FROM workspaces w
           JOIN workspace_members wm ON wm.workspace_id = w.id
           WHERE wm.user_id = $1
           ORDER BY w.created_at DESC""",
        user_id
    )
    return [dict(r) for r in rows]

@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(
    workspace_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await _require_member(db, workspace_id, user_id)
    return dict(row)

@router.post("/{workspace_id}/members", status_code=201)
async def add_member(
    workspace_id: str,
    body: MemberAdd,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_role(db, workspace_id, user_id, ["owner"])
    await db.execute(
        """INSERT INTO workspace_members (workspace_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role""",
        workspace_id, str(body.user_id), body.role
    )
    return {"detail": "member added"}

@router.delete("/{workspace_id}/members/{member_id}", status_code=204)
async def remove_member(
    workspace_id: str,
    member_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_role(db, workspace_id, user_id, ["owner"])
    await db.execute(
        "DELETE FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, member_id
    )
@router.get("/storage")
async def get_storage_stats(
    workspace_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    """Return storage metrics (bytes used and file count)."""
    if workspace_id:
        await _require_member(db, workspace_id, user_id)
        row = await db.fetchrow(
            "SELECT COALESCE(SUM(size_bytes), 0) as total_bytes, COUNT(*) as file_count FROM files WHERE workspace_id=$1",
            workspace_id
        )
    else:
        # Sum across all user's workspaces
        row = await db.fetchrow(
            """SELECT COALESCE(SUM(f.size_bytes), 0) as total_bytes, COUNT(f.*) as file_count 
               FROM files f
               JOIN workspace_members wm ON wm.workspace_id = f.workspace_id
               WHERE wm.user_id = $1""",
            user_id
        )
    return dict(row)

# ── Helpers ───────────────────────────────────────────────────────────────────

async def _require_member(db, workspace_id, user_id):
    row = await db.fetchrow(
        """SELECT w.* FROM workspaces w
           JOIN workspace_members wm ON wm.workspace_id = w.id
           WHERE w.id=$1 AND wm.user_id=$2""",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(404, "Workspace not found or access denied")
    return row

async def _require_role(db, workspace_id, user_id, allowed_roles: list[str]):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row or row["role"] not in allowed_roles:
        raise HTTPException(403, "Insufficient permissions")
