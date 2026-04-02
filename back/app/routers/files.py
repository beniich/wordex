import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
import asyncpg
from minio import Minio
from minio.error import S3Error

from app.database import get_db
from app.auth import get_current_user_id
from app.models import FileOut

router = APIRouter()

MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET     = os.getenv("MINIO_BUCKET",     "collab-files")
MINIO_SECURE     = os.getenv("MINIO_SECURE",     "false").lower() == "true"
PRESIGN_EXPIRY   = int(os.getenv("PRESIGN_EXPIRY_SECONDS", "3600"))

_minio: Minio = None

def get_minio() -> Minio:
    global _minio
    if _minio is None:
        _minio = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE,
        )
        if not _minio.bucket_exists(MINIO_BUCKET):
            _minio.make_bucket(MINIO_BUCKET)
    return _minio

# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=FileOut, status_code=201)
async def upload_file(
    workspace_id: str = Query(...),
    document_id: str | None = Query(None),
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_write(db, workspace_id, user_id)

    storage_key = f"{workspace_id}/{uuid.uuid4()}_{file.filename}"
    content = await file.read()

    minio = get_minio()
    try:
        from io import BytesIO
        minio.put_object(
            MINIO_BUCKET,
            storage_key,
            BytesIO(content),
            length=len(content),
            content_type=file.content_type or "application/octet-stream",
        )
    except S3Error as e:
        raise HTTPException(500, f"Storage error: {e}")

    row = await db.fetchrow(
        """INSERT INTO files
               (workspace_id, document_id, filename, storage_key, mime_type, size_bytes, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, filename, mime_type, size_bytes, uploaded_by, created_at""",
        workspace_id, document_id, file.filename,
        storage_key, file.content_type, len(content), user_id
    )
    result = dict(row)
    result["download_url"] = _presign(minio, storage_key)
    return result

# ── List ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[FileOut])
async def list_files(
    workspace_id: str = Query(...),
    document_id: str | None = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    await _require_read(db, workspace_id, user_id)
    minio = get_minio()

    if document_id:
        rows = await db.fetch(
            """SELECT id, filename, storage_key, mime_type, size_bytes, uploaded_by, created_at
               FROM files WHERE workspace_id=$1 AND document_id=$2
               ORDER BY created_at DESC""",
            workspace_id, document_id
        )
    else:
        rows = await db.fetch(
            """SELECT id, filename, storage_key, mime_type, size_bytes, uploaded_by, created_at
               FROM files WHERE workspace_id=$1
               ORDER BY created_at DESC""",
            workspace_id
        )

    result = []
    for r in rows:
        f = dict(r)
        f["download_url"] = _presign(minio, f.pop("storage_key"))
        result.append(f)
    return result

# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{file_id}", status_code=204)
async def delete_file(
    file_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db),
):
    row = await db.fetchrow(
        "SELECT workspace_id, storage_key FROM files WHERE id=$1", file_id
    )
    if not row:
        raise HTTPException(404, "File not found")

    await _require_write(db, str(row["workspace_id"]), user_id)

    minio = get_minio()
    try:
        minio.remove_object(MINIO_BUCKET, row["storage_key"])
    except S3Error:
        pass  # already gone

    await db.execute("DELETE FROM files WHERE id=$1", file_id)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _presign(minio: Minio, storage_key: str) -> str:
    from datetime import timedelta
    try:
        return minio.presigned_get_object(
            MINIO_BUCKET, storage_key, expires=timedelta(seconds=PRESIGN_EXPIRY)
        )
    except S3Error:
        return ""

async def _require_read(db, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(403, "Access denied")

async def _require_write(db, workspace_id: str, user_id: str):
    row = await db.fetchrow(
        "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
        workspace_id, user_id
    )
    if not row:
        raise HTTPException(403, "Access denied")
    if row["role"] == "viewer":
        raise HTTPException(403, "Read-only access")
