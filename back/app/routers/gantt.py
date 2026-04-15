from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import uuid

from app.database import get_db
from app.auth import get_current_user_id
from app.models import GanttTaskCreate, GanttTaskUpdate, GanttTaskOut, GanttResourceCreate, GanttResourceOut, GanttDataOut

router = APIRouter()

@router.get("/{doc_id}", response_model=GanttDataOut)
async def get_gantt(doc_id: uuid.UUID, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    tasks_records = await db.fetch("""
        SELECT * FROM gantt_tasks WHERE document_id = $1 ORDER BY position ASC, start_date ASC
    """, doc_id)
    
    resources_records = await db.fetch("""
        SELECT * FROM gantt_resources WHERE document_id = $1
    """, doc_id)

    tasks = [dict(t) for t in tasks_records]
    resources = [dict(r) for r in resources_records]
    
    date_range = {"start": None, "end": None}
    if tasks:
        date_range["start"] = min([t['start_date'] for t in tasks if t['start_date']]).isoformat() if any([t['start_date'] for t in tasks]) else None
        date_range["end"] = max([t['end_date'] for t in tasks if t['end_date']]).isoformat() if any([t['end_date'] for t in tasks]) else None

    for t in tasks:
        t['assignee_ids'] = t.get('assignee_ids') or []
        t['start_date'] = t['start_date'].isoformat() if t['start_date'] else None
        t['end_date'] = t['end_date'].isoformat() if t['end_date'] else None
        t['dependencies'] = []
    
    return {
        "document_id": doc_id,
        "tasks": tasks,
        "resources": resources,
        "date_range": date_range
    }

@router.post("/{doc_id}/tasks", response_model=GanttTaskOut)
async def create_task(doc_id: uuid.UUID, task: GanttTaskCreate, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    record = await db.fetchrow("""
        INSERT INTO gantt_tasks 
        (document_id, name, task_type, start_date, end_date, progress, priority, parent_id, assignee_ids, color, position)
        VALUES ($1, $2, $3, $4::date, $5::date, $6, $7, $8, $9, $10, $11)
        RETURNING *
    """, doc_id, task.name, task.task_type, task.start_date, task.end_date, task.progress, task.priority, task.parent_id, task.assignee_ids, task.color, task.position)
    
    r = dict(record)
    r['assignee_ids'] = r.get('assignee_ids') or []
    r['start_date'] = r['start_date'].isoformat()
    r['end_date'] = r['end_date'].isoformat()
    r['dependencies'] = []
    return r

@router.patch("/{doc_id}/tasks/{task_id}", response_model=GanttTaskOut)
async def update_task(doc_id: uuid.UUID, task_id: uuid.UUID, task: GanttTaskUpdate, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    fields = []
    values = []
    idx = 1
    
    for key, val in task.model_dump(exclude_unset=True).items():
        if key in ['start_date', 'end_date']:
            fields.append(f"{key} = ${idx}::date")
        else:
            fields.append(f"{key} = ${idx}")
        values.append(val)
        idx += 1
        
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    values.append(task_id)
    values.append(doc_id)
    query = f"UPDATE gantt_tasks SET {', '.join(fields)}, updated_at = now() WHERE id = ${idx} AND document_id = ${idx+1} RETURNING *"
    
    record = await db.fetchrow(query, *values)
    if not record:
        raise HTTPException(status_code=404, detail="Task not found")
        
    r = dict(record)
    r['assignee_ids'] = r.get('assignee_ids') or []
    r['start_date'] = r['start_date'].isoformat()
    r['end_date'] = r['end_date'].isoformat()
    r['dependencies'] = []
    return r

@router.delete("/{doc_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(doc_id: uuid.UUID, task_id: uuid.UUID, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    deleted = await db.execute("DELETE FROM gantt_tasks WHERE id = $1 AND document_id = $2", task_id, doc_id)
    if deleted == "DELETE 0":
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@router.post("/{doc_id}/bulk-update", status_code=status.HTTP_204_NO_CONTENT)
async def bulk_update_tasks(doc_id: uuid.UUID, tasks: List[dict], db=Depends(get_db), user_id=Depends(get_current_user_id)):
    for t in tasks:
        task_id = t.get("id")
        if not task_id: continue
        
        await db.execute("""
            UPDATE gantt_tasks 
            SET start_date = COALESCE($1::date, start_date), 
                end_date = COALESCE($2::date, end_date), 
                progress = COALESCE($3, progress),
                position = COALESCE($4, position)
            WHERE id = $5 AND document_id = $6
        """, t.get('start_date'), t.get('end_date'), t.get('progress'), t.get('position'), task_id, doc_id)
    
    return None

@router.get("/{doc_id}/resources", response_model=List[GanttResourceOut])
async def get_resources(doc_id: uuid.UUID, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    records = await db.fetch("SELECT * FROM gantt_resources WHERE document_id = $1", doc_id)
    return [dict(r) for r in records]

@router.post("/{doc_id}/resources", response_model=GanttResourceOut)
async def create_resource(doc_id: uuid.UUID, res: GanttResourceCreate, db=Depends(get_db), user_id=Depends(get_current_user_id)):
    record = await db.fetchrow("""
        INSERT INTO gantt_resources (document_id, name, resource_type, capacity, color)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    """, doc_id, res.name, res.resource_type, res.capacity, res.color)
    return dict(record)
