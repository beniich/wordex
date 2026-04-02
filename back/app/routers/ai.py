"""
Wordex AI Agent — powered by Ollama (local LLM)
Routes: /suggest, /summarize, /translate, /chat, /code, /admin, /analyze
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, AsyncIterator
import httpx
import os
import json

from app.auth import get_current_user_id
from app.database import get_db
import asyncpg
from app.models import AIChatSessionCreate, AIChatSessionOut, AIChatMessageRequest

router = APIRouter()

# ── Config ────────────────────────────────────────────────────────────────────
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL    = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

# ── Agent System Prompts ───────────────────────────────────────────────────────
SYSTEM_PROMPTS = {
    "editor": (
        "You are Wordex AI, an expert document writing assistant. "
        "You help users write, edit, improve, and structure documents professionally. "
        "Be concise, clear, and maintain the user's voice. "
        "Always respond in the same language as the user's input."
    ),
    "analyst": (
        "You are Wordex Data Analyst, an expert in business intelligence, data analysis, "
        "and visualization. You help users understand data, create insights, and build reports. "
        "Provide structured, actionable analysis."
    ),
    "admin": (
        "You are Wordex Admin Assistant, an expert in system administration, user management, "
        "deployment, security auditing, and platform operations. "
        "Provide clear, technical, and precise guidance for platform administrators."
    ),
    "code": (
        "You are Wordex Code Agent, an expert full-stack developer. "
        "You help with frontend (React/Next.js), backend (Python/FastAPI), "
        "and DevOps (Docker, CI/CD). Write clean, production-ready code with explanations."
    ),
    "general": (
        "You are Wordex AI, a versatile intelligent assistant. "
        "You help with writing, analysis, coding, and any task the user needs. "
        "Be helpful, accurate, and concise."
    ),
    "designer": (
        "You are Wordex Presentation Designer, an expert in creating high-impact visual "
        "presentations, slide decks, and pitch materials. You structure content for maximum "
        "clarity and impact. When asked for JSON, return ONLY pure valid JSON without markdown blocks."
    ),
}

# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    agent: Optional[str] = "general"   # editor | analyst | admin | code | general
    stream: Optional[bool] = False
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 2048

class AISuggestRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    doc_id: Optional[str] = None
    mode: Optional[str] = "continue"  # continue | improve | expand | fix

class AISummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = 200
    style: Optional[str] = "bullets"  # bullets | paragraph | tldr

class AITranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: Optional[str] = "auto"

class AIAnalyzeRequest(BaseModel):
    content: str
    analysis_type: Optional[str] = "general"  # general | sentiment | keywords | readability


# ── Ollama Client ─────────────────────────────────────────────────────────────

async def ollama_generate(
    prompt: str,
    system: str = "",
    model: str = OLLAMA_MODEL,
    stream: bool = False,
    temperature: float = 0.7,
) -> str:
    """Non-streaming Ollama generation."""
    payload = {
        "model": model,
        "prompt": prompt,
        "system": system,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 2048,
        }
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
        except httpx.ConnectError:
            raise HTTPException(503, "Ollama service unavailable. Ensure docker is running.")
        except httpx.TimeoutException:
            raise HTTPException(504, "AI request timed out. Try a shorter prompt.")


async def ollama_chat(
    messages: List[dict],
    system: str = "",
    model: str = OLLAMA_MODEL,
    temperature: float = 0.7,
) -> str:
    """Chat-style Ollama generation."""
    payload = {
        "model": model,
        "messages": messages,
        "system": system,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 2048,
        }
    }
    async with httpx.AsyncClient(timeout=180.0) as client:
        try:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data.get("message", {}).get("content", "")
        except httpx.ConnectError:
            raise HTTPException(503, "Ollama service unavailable.")
        except httpx.TimeoutException:
            raise HTTPException(504, "AI request timed out.")


async def ollama_stream(
    messages: List[dict],
    system: str = "",
    model: str = OLLAMA_MODEL,
    temperature: float = 0.7,
) -> AsyncIterator[str]:
    """Streaming chat response as SSE."""
    payload = {
        "model": model,
        "messages": messages,
        "system": system,
        "stream": True,
        "options": {
            "temperature": temperature,
            "num_predict": 2048,
        }
    }
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("POST", f"{OLLAMA_BASE_URL}/api/chat", json=payload) as resp:
            async for line in resp.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        tok = data.get("message", {}).get("content", "")
                        if tok:
                            yield f"data: {json.dumps({'token': tok})}\n\n"
                        if data.get("done"):
                            yield "data: [DONE]\n\n"
                    except json.JSONDecodeError:
                        continue


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/models")
async def list_models():
    """List available Ollama models."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            resp.raise_for_status()
            return resp.json()
        except Exception:
            return {"models": [], "error": "Ollama not reachable"}


@router.get("/health")
async def ai_health():
    """Check Ollama connectivity."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            models = resp.json().get("models", [])
            return {
                "status": "online",
                "ollama_url": OLLAMA_BASE_URL,
                "model": OLLAMA_MODEL,
                "available_models": [m["name"] for m in models],
            }
        except Exception as e:
            return {"status": "offline", "error": str(e)}


@router.post("/chat")
async def ai_chat(
    body: ChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Universal AI chat — supports all agents: editor, analyst, admin, code, general.
    Supports streaming (SSE) or non-streaming.
    """
    system = SYSTEM_PROMPTS.get(body.agent or "general", SYSTEM_PROMPTS["general"])
    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    if body.stream:
        return StreamingResponse(
            ollama_stream(messages, system=system, temperature=body.temperature or 0.7),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            }
        )

    text = await ollama_chat(messages, system=system, temperature=body.temperature or 0.7)
    return {"response": text, "agent": body.agent, "model": OLLAMA_MODEL}

@router.post("/sessions", response_model=AIChatSessionOut)
async def create_session(
    body: AIChatSessionCreate,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    """Create a new persistent AI chat session."""
    try:
        row = await db.fetchrow(
            """
            INSERT INTO ai_chat_sessions (user_id, document_id, agent, title, messages)
            VALUES ($1, $2, $3, $4, '[]')
            RETURNING *
            """,
            user_id, body.document_id, body.agent, body.title
        )
        d = dict(row)
        if isinstance(d['messages'], str):
            d['messages'] = json.loads(d['messages'])
        return d
    except Exception as e:
        raise HTTPException(500, f"DB Error: {e}")

@router.get("/sessions", response_model=List[AIChatSessionOut])
async def list_sessions(
    document_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    """List persistent sessions, optionally filtered by document_id."""
    if document_id:
        rows = await db.fetch(
            "SELECT * FROM ai_chat_sessions WHERE user_id=$1 AND document_id=$2 ORDER BY updated_at DESC", 
            user_id, document_id
        )
    else:
        rows = await db.fetch(
            "SELECT * FROM ai_chat_sessions WHERE user_id=$1 ORDER BY updated_at DESC", 
            user_id
        )
    
    def parse_row(r):
        d = dict(r)
        if isinstance(d['messages'], str):
            d['messages'] = json.loads(d['messages'])
        return d
    return [parse_row(r) for r in rows]

@router.get("/sessions/{session_id}", response_model=AIChatSessionOut)
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    row = await db.fetchrow("SELECT * FROM ai_chat_sessions WHERE id=$1 AND user_id=$2", session_id, user_id)
    if not row:
        raise HTTPException(404, "Session not found")
    d = dict(row)
    if isinstance(d['messages'], str):
        d['messages'] = json.loads(d['messages'])
    return d

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    deleted = await db.execute("DELETE FROM ai_chat_sessions WHERE id=$1 AND user_id=$2", session_id, user_id)
    if deleted == "DELETE 0":
        raise HTTPException(404, "Session not found")
    return {"status": "deleted"}

@router.post("/sessions/{session_id}/message")
async def add_session_message(
    session_id: str,
    message: AIChatMessageRequest,
    user_id: str = Depends(get_current_user_id),
    db: asyncpg.Connection = Depends(get_db)
):
    """Post a message to an existing session and get AI response, state is saved."""
    row = await db.fetchrow("SELECT * FROM ai_chat_sessions WHERE id=$1 AND user_id=$2", session_id, user_id)
    if not row:
        raise HTTPException(404, "Session not found")

    messages = row["messages"]
    if isinstance(messages, str):
        messages = json.loads(messages)
    
    # Message to send to Ollama (with context)
    content_with_context = message.content
    if message.context:
        content_with_context = f"Document Context:\n{message.context}\n\nUser Question: {message.content}"
    
    # Store clean user message in history
    user_msg = {"role": message.role, "content": message.content}
    messages.append(user_msg)

    # For generation, we use the context-enriched prompt
    generation_messages = messages[:-1] + [{"role": message.role, "content": content_with_context}]

    agent = row["agent"]
    system_prompt = SYSTEM_PROMPTS.get(agent, SYSTEM_PROMPTS["general"])
    
    assistant_text = await ollama_chat(generation_messages, system=system_prompt)
    assistant_msg = {"role": "assistant", "content": assistant_text}
    messages.append(assistant_msg)

    added_tokens = (len(message.content) + len(assistant_text)) // 4

    new_row = await db.fetchrow(
        """
        UPDATE ai_chat_sessions 
        SET messages=$1, updated_at=now(), tokens_used=tokens_used+$2
        WHERE id=$3 AND user_id=$4
        RETURNING *
        """,
        json.dumps(messages), added_tokens, session_id, user_id
    )
    
    return {
        "response": assistant_text,
        "tokens_used": new_row["tokens_used"],
        "messages": messages
    }



@router.post("/suggest")
async def ai_suggest(
    body: AISuggestRequest,
    user_id: str = Depends(get_current_user_id),
):
    """AI writing suggestion — continue, improve, expand, or fix text."""
    mode_instructions = {
        "continue": "Continue writing naturally from where the text ends. Match the tone and style.",
        "improve":  "Rewrite the following text to be clearer, more professional, and more engaging.",
        "expand":   "Expand the following text with more detail, examples, and supporting points.",
        "fix":      "Fix grammar, spelling, and clarity issues in the following text.",
    }
    instruction = mode_instructions.get(body.mode or "continue", mode_instructions["continue"])

    context_block = f"\nDocument context:\n{body.context}\n" if body.context else ""
    prompt = f"{instruction}\n{context_block}\nText: {body.prompt}"

    result = await ollama_generate(
        prompt=prompt,
        system=SYSTEM_PROMPTS["editor"],
        temperature=0.8,
    )
    return {"suggestion": result, "mode": body.mode}


@router.post("/summarize")
async def ai_summarize(
    body: AISummarizeRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Summarize document text."""
    style_instructions = {
        "bullets":   "Summarize as concise bullet points (max 5-7 points).",
        "paragraph": "Summarize as a single clear paragraph.",
        "tldr":      "Write a one-sentence TL;DR summary.",
    }
    instruction = style_instructions.get(body.style or "bullets", style_instructions["bullets"])

    prompt = f"{instruction}\n\nText to summarize:\n{body.text[:4000]}"
    result = await ollama_generate(
        prompt=prompt,
        system=SYSTEM_PROMPTS["analyst"],
        temperature=0.3,
    )
    return {"summary": result, "style": body.style}


@router.post("/translate")
async def ai_translate(
    body: AITranslateRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Translate text to target language."""
    lang_names = {
        "fr": "French", "en": "English", "ar": "Arabic",
        "es": "Spanish", "de": "German", "it": "Italian",
        "pt": "Portuguese", "ja": "Japanese", "zh": "Chinese",
        "ru": "Russian", "ko": "Korean", "nl": "Dutch",
    }
    target = lang_names.get(body.target_lang, body.target_lang)
    prompt = (
        f"Translate the following text to {target}. "
        "Only return the translation, nothing else.\n\n"
        f"Text: {body.text}"
    )
    result = await ollama_generate(prompt=prompt, temperature=0.1)
    return {
        "translated": result,
        "target_lang": body.target_lang,
        "source_lang": body.source_lang,
    }


@router.post("/analyze")
async def ai_analyze(
    body: AIAnalyzeRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Analyze document content for insights."""
    analysis_prompts = {
        "general":     "Analyze this document and provide key insights, main topics, and recommendations.",
        "sentiment":   "Analyze the sentiment and tone of this text. Is it positive, negative, neutral, formal, etc.?",
        "keywords":    "Extract the top 10 keywords and key phrases from this text, with brief explanations.",
        "readability": "Analyze the readability of this text. Rate it, identify complex sections, and suggest improvements.",
    }
    instruction = analysis_prompts.get(body.analysis_type or "general", analysis_prompts["general"])
    prompt = f"{instruction}\n\nDocument:\n{body.content[:4000]}"
    result = await ollama_generate(
        prompt=prompt,
        system=SYSTEM_PROMPTS["analyst"],
        temperature=0.4,
    )
    return {"analysis": result, "type": body.analysis_type}


@router.post("/code")
async def ai_code(
    body: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    """Code generation and review agent."""
    task    = body.get("task", "")
    code    = body.get("code", "")
    lang    = body.get("language", "python")
    action  = body.get("action", "generate")  # generate | review | explain | refactor

    action_prompts = {
        "generate": f"Write clean, production-ready {lang} code for: {task}",
        "review":   f"Review this {lang} code, identify bugs, security issues, and improvements:\n\n{code}",
        "explain":  f"Explain this {lang} code in simple terms:\n\n{code}",
        "refactor": f"Refactor this {lang} code to be cleaner and more efficient:\n\n{code}",
    }
    prompt = action_prompts.get(action, action_prompts["generate"])
    result = await ollama_generate(
        prompt=prompt,
        system=SYSTEM_PROMPTS["code"],
        temperature=0.2,
    )
    return {"result": result, "action": action, "language": lang}


@router.post("/admin")
async def ai_admin(
    body: dict = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    """Admin AI assistant for platform operations."""
    query = body.get("query", "")
    context = body.get("context", "")

    prompt = f"""
As a platform admin assistant, help with:
Query: {query}
Context: {context}
Provide clear, actionable guidance for platform administration.
"""
    result = await ollama_generate(
        prompt=prompt,
        system=SYSTEM_PROMPTS["admin"],
        temperature=0.3,
    )
    return {"response": result}
