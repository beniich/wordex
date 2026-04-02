"""
Webhook Delivery Service for Wordex.

Stores webhook registrations in SQL and delivers HTTP POST events
with HMAC-SHA256 signatures, retries, and delivery logs.
"""

import json
import hmac
import hashlib
import asyncio
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.database import get_db_pool

logger = logging.getLogger(__name__)

MAX_RETRIES  = 3
RETRY_DELAYS = [5, 30, 120]  # seconds between retries
TIMEOUT_SECS = 10

class WebhookService:
    def __init__(self):
        pass

    async def connect(self):
        # We use get_db_pool() directly for operations, so nothing to init here.
        pass

    async def disconnect(self):
        pass

    # ── CRUD ──────────────────────────────────────────────────────────────────

    async def register(
        self,
        workspace_id: str,
        url: str,
        events: list[str],
        secret: str,
        name: str = "",
    ) -> dict:
        """Register a new webhook. Returns the created config."""
        pool = get_db_pool()
        if not pool: return {}
        async with pool.acquire() as db:
            row = await db.fetchrow(
                """INSERT INTO webhooks (workspace_id, name, url, events, secret)
                   VALUES ($1, $2, $3, $4, $5)
                   RETURNING id, workspace_id, name, url, events, secret, active, created_at""",
                workspace_id, name or url, url, events, secret
            )
            res = dict(row)
            res['id'] = str(res['id'])
            res['workspace_id'] = str(res['workspace_id'])
            res['created_at'] = res['created_at'].isoformat() if res['created_at'] else None
            return res

    async def list_webhooks(self, workspace_id: Optional[str] = None) -> list[dict]:
        pool = get_db_pool()
        if not pool: return []
        async with pool.acquire() as db:
            if workspace_id:
                rows = await db.fetch("SELECT * FROM webhooks WHERE workspace_id::text = $1", workspace_id)
            else:
                rows = await db.fetch("SELECT * FROM webhooks")
            
            res_list = []
            for r in rows:
                d = dict(r)
                d['id'] = str(d['id'])
                d['workspace_id'] = str(d['workspace_id'])
                d['created_at'] = d['created_at'].isoformat() if d['created_at'] else None
                res_list.append(d)
            return res_list

    async def get_webhook(self, webhook_id: str) -> Optional[dict]:
        pool = get_db_pool()
        if not pool: return None
        async with pool.acquire() as db:
            r = await db.fetchrow("SELECT * FROM webhooks WHERE id::text = $1", webhook_id)
            if not r: return None
            d = dict(r)
            d['id'] = str(d['id'])
            d['workspace_id'] = str(d['workspace_id'])
            d['created_at'] = d['created_at'].isoformat() if d['created_at'] else None
            return d

    async def update_webhook(self, webhook_id: str, **kwargs) -> Optional[dict]:
        pool = get_db_pool()
        if not pool: return None
        fields = []
        values = []
        i = 1
        for k, v in kwargs.items():
            if k in ['name', 'url', 'events', 'secret', 'active']:
                fields.append(f"{k} = ${i}")
                values.append(v)
                i += 1
        
        if not fields:
            return await self.get_webhook(webhook_id)
            
        values.append(webhook_id)
        query = f"UPDATE webhooks SET {', '.join(fields)} WHERE id::text = ${i} RETURNING *"
        async with pool.acquire() as db:
            r = await db.fetchrow(query, *values)
            if not r: return None
            d = dict(r)
            d['id'] = str(d['id'])
            d['workspace_id'] = str(d['workspace_id'])
            d['created_at'] = d['created_at'].isoformat() if d['created_at'] else None
            return d

    async def delete_webhook(self, webhook_id: str) -> bool:
        pool = get_db_pool()
        if not pool: return False
        async with pool.acquire() as db:
            res = await db.execute("DELETE FROM webhooks WHERE id::text = $1", webhook_id)
            return res == "DELETE 1"

    # ── Delivery ──────────────────────────────────────────────────────────────

    @staticmethod
    def _sign_payload(payload: str, secret: str) -> str:
        return hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()

    async def deliver_event(self, event: Dict[str, Any]):
        """
        Called by the event bus handler.
        Finds all matching webhooks and fires async delivery tasks.
        """
        event_type = event.get("type", "")
        workspace_id = event.get("workspace_id")

        all_webhooks = await self.list_webhooks(workspace_id)
        targets = [
            w for w in all_webhooks
            if w.get("active")
            and ("*" in w.get("events", []) or event_type in w.get("events", []))
        ]

        for webhook in targets:
            asyncio.create_task(self._deliver_with_retry(webhook, event))

    async def _deliver_with_retry(self, webhook: dict, event: dict, attempt: int = 0):
        """HTTP POST with HMAC signature and exponential back-off."""
        payload = json.dumps(event)
        signature = self._sign_payload(payload, webhook.get("secret", ""))

        headers = {
            "Content-Type": "application/json",
            "X-Wordex-Event":     event.get("type", ""),
            "X-Wordex-Signature": f"sha256={signature}",
            "X-Wordex-Delivery":  event.get("id", ""),
        }

        webhook_id = webhook["id"]
        status_code = 0
        success = False
        response_text = ""
        
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT_SECS) as client:
                response = await client.post(
                    webhook["url"],
                    content=payload,
                    headers=headers,
                )
            status_code = response.status_code
            success = status_code < 300
            response_text = response.text[:500]
            logger.info("Webhook %s -> %s | %d", webhook_id, event.get("type"), status_code)
        except Exception as e:
            success = False
            response_text = str(e)[:500]
            logger.warning("Webhook delivery failed: %s", e)

        # Persist delivery log in SQL
        pool = get_db_pool()
        if pool:
            async with pool.acquire() as db:
                await db.execute(
                    """INSERT INTO webhook_deliveries (webhook_id, event_type, status_code, success, response)
                       VALUES ($1, $2, $3, $4, $5)""",
                    webhook_id, event.get("type"), status_code, success, response_text
                )

        # Retry on failure
        if not success and attempt < MAX_RETRIES - 1:
            delay = RETRY_DELAYS[attempt]
            logger.info("Retrying webhook in %ds (attempt %d)", delay, attempt + 2)
            await asyncio.sleep(delay)
            await self._deliver_with_retry(webhook, event, attempt + 1)

    async def get_delivery_log(
        self,
        webhook_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        pool = get_db_pool()
        if not pool: return []
        async with pool.acquire() as db:
            if webhook_id:
                rows = await db.fetch(
                    "SELECT * FROM webhook_deliveries WHERE webhook_id::text = $1 ORDER BY delivered_at DESC LIMIT $2",
                    webhook_id, limit
                )
            else:
                rows = await db.fetch(
                    "SELECT * FROM webhook_deliveries ORDER BY delivered_at DESC LIMIT $1", limit
                )
            
            res_list = []
            for r in rows:
                d = dict(r)
                d['id'] = str(d['id'])
                d['webhook_id'] = str(d['webhook_id']) if d.get('webhook_id') else None
                d['delivered_at'] = d['delivered_at'].isoformat() if d.get('delivered_at') else None
                res_list.append(d)
            return res_list


# Global singleton
webhook_service = WebhookService()
