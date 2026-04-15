# back/app/routers/proxy.py
from fastapi import APIRouter, Request, HTTPException
import httpx
import json

router = APIRouter(prefix="/api/llmstudio", tags=["llmstudio-proxy"])

LLM_STUDIO_URL = "http://127.0.0.1:11434/v1"

@router.post("/{endpoint:path}")
async def proxy(endpoint: str, request: Request):
    """
    Forward any request from /api/llmstudio/* vers le serveur LLM Studio
    (ex. /completions, /chat/completions, /models etc.).
    Le corps JSON est transmis tel‑quel.
    """
    body = await request.body()
    url = f"{LLM_STUDIO_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(url, content=body, headers={"Content-Type": "application/json"})
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM‑Studio unreachable: {e}")
