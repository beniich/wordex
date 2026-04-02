"""
REST API router for Webhooks.

Endpoints:
  POST   /webhooks                → Register a webhook
  GET    /webhooks                → List webhooks (workspace scoped)
  GET    /webhooks/{id}           → Get single webhook
  PATCH  /webhooks/{id}           → Update (enable/disable/change url)
  DELETE /webhooks/{id}           → Delete
  GET    /webhooks/{id}/deliveries → Delivery log
  GET    /webhooks/events         → List supported event types
  POST   /webhooks/test           → Send test event to a URL
"""

import hmac
import hashlib
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, AnyHttpUrl

from app.auth import get_current_user_id
from app.services.webhook_service import webhook_service
from app.services.event_bus import EVENT_TYPES

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class WebhookCreate(BaseModel):
    workspace_id: str
    url: str
    events: List[str]       # e.g. ["document.updated", "comment.created"] or ["*"]
    secret: str
    name: Optional[str] = ""


class WebhookUpdate(BaseModel):
    url: Optional[str] = None
    events: Optional[List[str]] = None
    active: Optional[bool] = None
    name: Optional[str] = None


class TestDeliveryRequest(BaseModel):
    url: str
    secret: str
    event_type: str = "webhook.test"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/events")
async def list_event_types():
    """List all supported event types."""
    return {"event_types": EVENT_TYPES}


@router.post("/", status_code=201)
async def create_webhook(
    body: WebhookCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Register a new webhook endpoint."""
    invalid = [e for e in body.events if e != "*" and e not in EVENT_TYPES]
    if invalid:
        raise HTTPException(400, f"Unknown event types: {invalid}")

    webhook = await webhook_service.register(
        workspace_id=body.workspace_id,
        url=body.url,
        events=body.events,
        secret=body.secret,
        name=body.name,
    )
    return webhook


@router.get("/")
async def list_webhooks(
    workspace_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
):
    return await webhook_service.list_webhooks(workspace_id=workspace_id)


@router.get("/{webhook_id}")
async def get_webhook(
    webhook_id: str,
    user_id: str = Depends(get_current_user_id),
):
    webhook = await webhook_service.get_webhook(webhook_id)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    return webhook


@router.patch("/{webhook_id}")
async def update_webhook(
    webhook_id: str,
    body: WebhookUpdate,
    user_id: str = Depends(get_current_user_id),
):
    updates = body.model_dump(exclude_none=True)
    webhook = await webhook_service.update_webhook(webhook_id, **updates)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    return webhook


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    webhook_id: str,
    user_id: str = Depends(get_current_user_id),
):
    deleted = await webhook_service.delete_webhook(webhook_id)
    if not deleted:
        raise HTTPException(404, "Webhook not found")


@router.get("/{webhook_id}/deliveries")
async def get_delivery_log(
    webhook_id: str,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    """Retrieve delivery attempts for a specific webhook."""
    records = await webhook_service.get_delivery_log(
        webhook_id=webhook_id, limit=limit
    )
    return {"deliveries": records}


@router.post("/test")
async def test_delivery(
    body: TestDeliveryRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Send a one-shot test event to a target URL to verify connectivity."""
    import httpx
    from datetime import datetime, timezone

    payload = json.dumps({
        "type": body.event_type,
        "id": "test-event-001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "payload": {"message": "This is a test event from Wordex."},
    })
    signature = hmac.new(
        body.secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            res = await client.post(
                body.url,
                content=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Wordex-Event": body.event_type,
                    "X-Wordex-Signature": f"sha256={signature}",
                },
            )
        return {
            "success": res.status_code < 300,
            "status_code": res.status_code,
            "response_body": res.text[:500],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
