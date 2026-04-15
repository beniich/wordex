from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime
import uuid

# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# ── Users ─────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    avatar_url: Optional[str]
    provider: str
    created_at: datetime

# ── Workspaces ────────────────────────────────────────────────────────────────

class WorkspaceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=40, pattern=r'^[a-z0-9\-]+$')
    description: Optional[str] = None
    icon: Optional[str] = "architecture"
    color: Optional[str] = "#894d0d"

class WorkspaceOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    icon: str
    color: str
    owner_id: uuid.UUID
    created_at: datetime

class MemberAdd(BaseModel):
    user_id: uuid.UUID
    role: str = Field(default="viewer", pattern=r'^(editor|viewer)$')

# ── Documents ─────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    workspace_id: uuid.UUID
    title: str = "Untitled"
    doc_type: str = Field(default="note", pattern=r'^(note|spreadsheet|presentation|gantt|analytics)$')
    parent_id: Optional[uuid.UUID] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Any] = None
    content_text: Optional[str] = None

class DocumentOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    title: str
    doc_type: str
    created_by: uuid.UUID
    updated_by: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

class DocumentDetailOut(DocumentOut):
    content: Optional[dict] = None
    content_text: Optional[str] = None

class DocumentSearchOut(DocumentOut):
    snippet: Optional[str] = None
    rank: Optional[float] = None

class RoleOut(BaseModel):
    role: str

class DocumentVersionOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version: int
    saved_by: uuid.UUID
    created_at: datetime
    saved_by_name: Optional[str] = None

class DocumentVersionDetailOut(DocumentVersionOut):
    content: Optional[dict] = None
    content_text: Optional[str] = None

# ── Files ─────────────────────────────────────────────────────────────────────

class FileOut(BaseModel):
    id: uuid.UUID
    filename: str
    mime_type: Optional[str]
    size_bytes: Optional[int]
    uploaded_by: uuid.UUID
    created_at: datetime
    download_url: Optional[str] = None   # pre-signed URL injected at response time

# ── Gantt ──────────────────────────────────────────────────────────────────────

class GanttTaskCreate(BaseModel):
    name: str
    task_type: str = Field(default="task", pattern=r'^(project|task|milestone)$')
    start_date: str   # ISO date YYYY-MM-DD
    end_date: str
    progress: int = Field(default=0, ge=0, le=100)
    priority: str = Field(default="medium", pattern=r'^(low|medium|high|critical)$')
    parent_id: Optional[uuid.UUID] = None
    assignee_ids: list[uuid.UUID] = []
    color: Optional[str] = None
    position: int = 0

class GanttTaskUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    priority: Optional[str] = None
    is_collapsed: Optional[bool] = None
    position: Optional[int] = None

class GanttTaskOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    name: str
    task_type: str
    start_date: str
    end_date: str
    progress: int
    priority: str
    assignee_ids: list[uuid.UUID]
    color: Optional[str]
    position: int
    is_collapsed: bool
    dependencies: list[uuid.UUID] = []
    created_at: datetime
    updated_at: datetime

class GanttResourceCreate(BaseModel):
    name: str
    resource_type: str = "human"
    capacity: int = 100
    color: Optional[str] = None

class GanttResourceOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    name: str
    resource_type: str
    capacity: int
    status: str
    color: Optional[str]

class GanttDataOut(BaseModel):
    document_id: uuid.UUID
    tasks: list[GanttTaskOut]
    resources: list[GanttResourceOut]
    date_range: dict

# ── AI Sessions ───────────────────────────────────────────────────────────────

class AIChatSessionCreate(BaseModel):
    document_id: Optional[uuid.UUID] = None
    agent: Optional[str] = "general"
    title: Optional[str] = "New Chat"

class AIChatSessionOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    document_id: Optional[uuid.UUID]
    agent: str
    title: Optional[str]
    messages: list[dict]
    tokens_used: int
    created_at: datetime
    updated_at: datetime

class AIChatMessageRequest(BaseModel):
    role: str = "user"
    content: str
    context: Optional[str] = None



#  Dashboard

class MachineCreate(BaseModel):
    name: str
    machine_type: str = "press"
    location: Optional[str] = None
    status: str = "online"

class MachineMetricCreate(BaseModel):
    machine_id: uuid.UUID
    availability: int = Field(ge=0, le=100)
    performance: int = Field(ge=0, le=100)
    quality: int = Field(ge=0, le=100)
    shift: str = "morning"

class ProductionRunCreate(BaseModel):
    machine_id: uuid.UUID
    shift: str
    target_lots: int = 250
    actual_lots: int = 0
    date: Optional[str] = None

class AmdecFailureCreate(BaseModel):
    machine_id: uuid.UUID
    mode: str
    severity: int = Field(ge=1, le=10)
    occurrence: int = Field(ge=1, le=10)
    detection: int = Field(ge=1, le=10)
    status: str = "open"

# ── Notifications ─────────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    recipient_id: uuid.UUID
    actor_id: uuid.UUID
    notif_type: str      # mention | share | comment | version_restore | member_added
    entity_type: str      # document | workspace | file
    entity_id: uuid.UUID
    entity_title: Optional[str] = None
    message: Optional[str] = None

class NotificationOut(BaseModel):
    id: uuid.UUID
    recipient_id: uuid.UUID
    actor_id: uuid.UUID
    notif_type: str
    entity_type: str
    entity_id: uuid.UUID
    entity_title: Optional[str]
    message: Optional[str]
    is_read: bool
    created_at: datetime
    actor_name: Optional[str] = None
    actor_avatar: Optional[str] = None
