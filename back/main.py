import os
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.database import init_db
from app.routers import (
    auth, users, documents, workspaces, files, folders, 
    search, notifications, comments, ai, exports, webhooks, 
    audio, sheets, slides, dashboard, gantt, analytics, 
    agents, organisations, stripe_billing, proxy
)
from app.services.event_bus import event_bus
from app.services.webhook_service import webhook_service

# --- Configuration du Limiteur de Débit (Rate Limiting) ---
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialisation des services au démarrage"""
    # Base de données
    await init_db()
    
    # Event Bus & Webhooks
    await event_bus.connect()
    await webhook_service.connect()
    
    # Souscription aux événements (Audit, Notifications, Webhooks)
    event_types = [
        "document.created", "document.updated", "document.deleted", 
        "comment.created", "user.joined"
    ]
    for etype in event_types:
        await event_bus.subscribe(etype, webhook_service.deliver_event)
        
    from app.routers.notifications import handle_notification_event
    await event_bus.subscribe("comment.created", handle_notification_event)
    
    # Lancement du bus d'événements en tâche de fond
    bg_task = asyncio.create_task(event_bus.listen())
    
    yield
    
    # Nettoyage
    bg_task.cancel()
    await event_bus.disconnect()
    await webhook_service.disconnect()

app = FastAPI(
    title="Wordex Engine API",
    version="1.1.0",
    description="Backend blindé et orchestrateur multi-agents",
    lifespan=lifespan
)

# --- Sécurité : Intégration du Limiteur ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Sécurité : Middlewares ---

# 1. CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3001"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Trusted Host (Prévention Host Header Injection)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=[os.getenv("ALLOWED_HOSTS", "*"), "localhost", "127.0.0.1"]
)

# 3. Headers de sécurité personnalisés (HSTS, NoSniff, No-Clickjacking)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none';"
    return response

# --- Montage des Routers ---
app.include_router(auth.router,            prefix="/api/auth",            tags=["🛡️ Auth"])
app.include_router(users.router,           prefix="/api/users",           tags=["👤 Users"])
app.include_router(workspaces.router,      prefix="/api/workspaces",      tags=["📦 Workspaces"])
app.include_router(documents.router,       prefix="/api/documents",       tags=["📄 Documents"])
app.include_router(files.router,           prefix="/api/files",           tags=["📁 Files"])
app.include_router(folders.router,         prefix="/api/folders",         tags=["📂 Folders"])
app.include_router(search.router,          prefix="/api/search",          tags=["🔍 Search"])
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["🔔 Notifications"])
app.include_router(comments.router,        prefix="/api/comments",        tags=["💬 Comments"])
app.include_router(ai.router,              prefix="/api/ai",              tags=["🧠 AI Core"])
app.include_router(exports.router,         prefix="/api/exports",         tags=["📤 Exports"])
app.include_router(webhooks.router,        prefix="/api/webhooks",        tags=["🪝 Webhooks"])
app.include_router(audio.router,           prefix="/api/audio",           tags=["🎙️ Audio"])
app.include_router(sheets.router,          prefix="/api/sheets",          tags=["📊 Sheets"])
app.include_router(slides.router,          prefix="/api/slides",          tags=["🎭 Slides"])
app.include_router(dashboard.router,       prefix="/api/dashboard",       tags=["📈 Dashboard"])
app.include_router(gantt.router,           prefix="/api/gantt",           tags=["📅 Gantt"])
app.include_router(analytics.router,       prefix="/api/analytics",       tags=["📊 Analytics"])
app.include_router(agents.router,                                         tags=["🤖 Multi-Agent Crew"])
app.include_router(organisations.router,   prefix="/api/organisations",   tags=["🏢 Organisations"])
app.include_router(stripe_billing.router,  prefix="/api/billing",         tags=["💳 Billing & Stripe"])
app.include_router(proxy.router)

# --- Health Check ---
@app.get("/health", tags=["System"])
async def health():
    return {"status": "healthy", "version": "1.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
