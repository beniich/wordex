"""
Redis-backed Event Bus for Wordex.

Usage:
  from app.services.event_bus import event_bus

  await event_bus.publish("document.updated", {"doc_id": "...", "user_id": "..."})
"""

import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Callable, Awaitable
import redis.asyncio as aioredis
import os

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── Known event types ─────────────────────────────────────────────────────────
# document.*  → CRUD on documents
# comment.*   → Comment created/resolved/deleted
# user.*      → User joined/left workspace
# export.*    → Export requested/completed
# webhook.*   → Webhook delivery result
EVENT_TYPES = [
    "document.created",
    "document.updated",
    "document.deleted",
    "document.exported",
    "comment.created",
    "comment.resolved",
    "user.joined",
    "user.left",
    "export.completed",
    "export.failed",
    "webhook.delivered",
    "webhook.failed",
]

CHANNEL_PREFIX = "wordex:events:"


class EventBus:
    """Async Redis pub/sub event bus with persistence in a list."""

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None
        self._pubsub: Optional[aioredis.client.PubSub] = None
        self._handlers: Dict[str, list] = {}

    async def connect(self):
        self._redis = await aioredis.from_url(REDIS_URL, decode_responses=True)
        logger.info("EventBus connected to Redis")

    async def disconnect(self):
        if self._redis:
            await self._redis.aclose()

    # ── Publish ────────────────────────────────────────────────────────────────

    async def publish(
        self,
        event_type: str,
        payload: Dict[str, Any],
        workspace_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        """Publish an event. Returns the event ID."""
        if not self._redis:
            raise RuntimeError("EventBus not connected")

        event_id = f"{event_type}:{datetime.now(timezone.utc).timestamp()}"
        event = {
            "id": event_id,
            "type": event_type,
            "workspace_id": workspace_id,
            "user_id": user_id,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        serialized = json.dumps(event)

        # 1. Persist in sorted-set (score=timestamp) for replay/audit
        score = datetime.now(timezone.utc).timestamp()
        await self._redis.zadd("wordex:event_log", {serialized: score})

        # 2. Trim log to last 10 000 events
        await self._redis.zremrangebyrank("wordex:event_log", 0, -10001)

        # 3. Pub/Sub broadcast on channel
        channel = f"{CHANNEL_PREFIX}{event_type}"
        await self._redis.publish(channel, serialized)

        # 4. Fan-out to workspace channel if relevant
        if workspace_id:
            ws_channel = f"{CHANNEL_PREFIX}workspace:{workspace_id}"
            await self._redis.publish(ws_channel, serialized)

        logger.debug("Published event %s", event_type)
        return event_id

    # ── Subscribe ──────────────────────────────────────────────────────────────

    async def subscribe(
        self,
        event_type: str,
        handler: Callable[[Dict], Awaitable[None]],
    ):
        """Register an async handler for a given event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    async def listen(self):
        """Start listening loop. Must be awaited in a background task."""
        if not self._redis:
            raise RuntimeError("EventBus not connected")

        pubsub = self._redis.pubsub()
        channels = [f"{CHANNEL_PREFIX}{t}" for t in self._handlers.keys()]
        if not channels:
            return
        await pubsub.subscribe(*channels)
        logger.info("EventBus listening on %d channels", len(channels))

        async for message in pubsub.listen():
            if message["type"] != "message":
                continue
            try:
                event = json.loads(message["data"])
                event_type = event.get("type")
                for handler in self._handlers.get(event_type, []):
                    asyncio.create_task(handler(event))
            except Exception as e:
                logger.error("EventBus handler error: %s", e)

    # ── Replay / audit ─────────────────────────────────────────────────────────

    async def recent_events(self, limit: int = 50, event_type: Optional[str] = None):
        """Retrieve recent events from the sorted-set log in reverse order."""
        if not self._redis:
            return []
        raw = await self._redis.zrevrange("wordex:event_log", 0, limit - 1)
        events = [json.loads(r) for r in raw]
        if event_type:
            events = [e for e in events if e.get("type") == event_type]
        return events


# Global singleton instance
event_bus = EventBus()
