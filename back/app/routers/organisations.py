"""
organisations.py — Multi-tenant Organisation management routes.
Handles CRUD for orgs and their member/plan metadata.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from app.auth import get_current_user_id

router = APIRouter()

# ── Pydantic models ───────────────────────────────────────────────────────────

class OrganisationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    slug: str = Field(min_length=2, max_length=40, pattern=r'^[a-z0-9\-]+$')
    description: Optional[str] = None

class OrganisationOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    plan: str
    stripe_customer_id: Optional[str]
    subscription_status: Optional[str]
    member_count: int = 0

# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", summary="List all organisations (SUPER_ADMIN)")
async def list_organisations(user_id: str = Depends(get_current_user_id)):
    # In production: verify SUPER_ADMIN role here via DB lookup
    return [
        {"id": "org-1", "name": "Clinique Alpha", "slug": "clinique-alpha", "plan": "PRO",
         "stripe_customer_id": "cus_xxx", "subscription_status": "active", "member_count": 12},
        {"id": "org-2", "name": "Centre Médical Omega", "slug": "omega", "plan": "ENTERPRISE",
         "stripe_customer_id": "cus_yyy", "subscription_status": "active", "member_count": 47},
        {"id": "org-3", "name": "Cabinet Bêta", "slug": "cabinet-beta", "plan": "FREE",
         "stripe_customer_id": None, "subscription_status": None, "member_count": 3},
    ]

@router.post("/", summary="Create organisation", status_code=201)
async def create_organisation(data: OrganisationCreate, user_id: str = Depends(get_current_user_id)):
    org_id = str(uuid.uuid4())
    return {"id": org_id, "name": data.name, "slug": data.slug, "plan": "FREE",
            "stripe_customer_id": None, "subscription_status": None, "member_count": 1}

@router.get("/{org_id}", summary="Get organisation details")
async def get_organisation(org_id: str, user_id: str = Depends(get_current_user_id)):
    return {"id": org_id, "name": "Clinique Alpha", "slug": "clinique-alpha", "plan": "PRO",
            "stripe_customer_id": "cus_xxx", "subscription_status": "active", "member_count": 12}

@router.patch("/{org_id}/plan", summary="Update organisation plan (admin)")
async def update_plan(org_id: str, plan: str, user_id: str = Depends(get_current_user_id)):
    if plan not in ["FREE", "PRO", "ENTERPRISE"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    return {"id": org_id, "plan": plan, "updated": True}
