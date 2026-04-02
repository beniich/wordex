from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routers import auth, users, documents, workspaces, files, folders, search, notifications, comments, ai, exports, webhooks, audio, sheets, slides, dashboard, gantt, analytics, agents
from app.services.event_bus import event_bus
from app.services.webhook_service import webhook_service
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    await init_db()
    
    # Initialize Event Bus & Webhook Service
    await event_bus.connect()
    await webhook_service.connect()
    
    # Subscribe Webhook Service to ALL events (*)
    for event_type in ["document.created", "document.updated", "document.deleted", "comment.created", "user.joined"]:
        await event_bus.subscribe(event_type, webhook_service.deliver_event)
        
    # Subscribe In-App Notifications
    from app.routers.notifications import handle_notification_event
    await event_bus.subscribe("comment.created", handle_notification_event)
    
    # Start listening background task
    bg_task = asyncio.create_task(event_bus.listen())
    
    yield
    
    # Cleanup
    bg_task.cancel()
    await event_bus.disconnect()
    await webhook_service.disconnect()

app = FastAPI(
    title="Wordex Engine API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,            prefix="/api/auth",            tags=["Auth"])
app.include_router(users.router,           prefix="/api/users",           tags=["Users"])
app.include_router(workspaces.router,      prefix="/api/workspaces",      tags=["Workspaces"])
app.include_router(documents.router,       prefix="/api/documents",       tags=["Documents"])
app.include_router(files.router,           prefix="/api/files",           tags=["Files"])
app.include_router(folders.router,         prefix="/api/folders",         tags=["Folders"])
app.include_router(search.router,          prefix="/api/search",          tags=["Search"])
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["Notifications"])
app.include_router(comments.router,        prefix="/api/comments",        tags=["Comments"])
app.include_router(ai.router,              prefix="/api/ai",              tags=["AI"])
app.include_router(exports.router,         prefix="/api/exports",         tags=["Exports"])
app.include_router(webhooks.router,        prefix="/api/webhooks",        tags=["Webhooks"])
app.include_router(audio.router,           prefix="/api/audio",           tags=["Audio"])
app.include_router(sheets.router,          prefix="/api/sheets",          tags=["Sheets"])
app.include_router(slides.router,          prefix="/api/slides",          tags=["Slides"])
app.include_router(dashboard.router,       prefix="/api/dashboard",       tags=["Dashboard"])

app.include_router(gantt.router,           prefix="/api/gantt",           tags=["Gantt"])
app.include_router(analytics.router,       prefix="/api/analytics",       tags=["Analytics"])
app.include_router(agents.router,                                         tags=["Multi-Agent Crew"])

@app.on_event("startup")
async def check_ollama_availability():
    import httpx
    import os
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')}/api/tags")
            if response.status_code == 200:
                print("✅ Ollama est disponible")
            else:
                print("⚠️ Ollama n'est pas accessible - certains agents peuvent ne pas fonctionner")
    except Exception as e:
        print(f"⚠️ Impossible de joindre Ollama: {e}")

@app.get("/health")
async def health():
    return {"status": "ok"}
