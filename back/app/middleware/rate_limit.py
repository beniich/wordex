import time
from typing import Optional

class WebhookRateLimiter:
    """
    Intelligent Rate Limiter for Webhook Deliveries.
    Integrates with Redis to prevent flooding target endpoints.
    """
    def __init__(self, redis_client):
        self.redis = redis_client
        self.limit = 100  # Default: 100 requests per hour
        self.window = 3600  # 1 hour window

    async def is_allowed(self, webhook_id: str, custom_limit: Optional[int] = None) -> bool:
        """
        Check if a given webhook delivery is within the allowed quota.
        """
        key = f"webhook_rate_limit:{webhook_id}"
        limit = custom_limit or self.limit
        
        # Atomically increment and set TTL
        current = await self.redis.incr(key)
        
        if current == 1:
            await self.redis.expire(key, self.window)
        
        if current > limit:
            # Audit log on rate limitation trigger
            await self.log_violation(webhook_id, current, limit)
            return False
            
        return True

    async def log_violation(self, webhook_id: str, value: int, limit: int):
        """
        Internal logging of quota violations.
        """
        timestamp = time.time()
        print(f"[🛡️ RATE LIMIT] Webhook {webhook_id} exceeded quota: {value}/{limit} at {timestamp}")

    async def reset_quota(self, webhook_id: str):
        """
        Manually reset a webhook's quota.
        """
        key = f"webhook_rate_limit:{webhook_id}"
        await self.redis.delete(key)
