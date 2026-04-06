"""
stripe_billing.py — Stripe integration for Wordex SaaS billing.
Handles Checkout Sessions, webhooks, portal access, and subscription sync.

Plans:
  - FREE:       gratuit, 3 users, 1 workspace
  - PRO:        49€/mois, 25 users, workspaces illimités
  - ENTERPRISE: 199€/mois, illimité, support dédié

Requires env vars:
  STRIPE_SECRET_KEY=sk_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_PRO=price_...
  STRIPE_PRICE_ENTERPRISE=price_...
  FRONTEND_URL=http://localhost:3000
"""

import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
from typing import Optional
from app.auth import get_current_user

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

PLANS = {
    "PRO":        os.getenv("STRIPE_PRICE_PRO", "price_pro_placeholder"),
    "ENTERPRISE": os.getenv("STRIPE_PRICE_ENTERPRISE", "price_enterprise_placeholder"),
}

# ── Schemas ───────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    plan: str          # "PRO" | "ENTERPRISE"
    org_id: str
    org_name: str

class PortalRequest(BaseModel):
    stripe_customer_id: str

# ── Checkout Session ──────────────────────────────────────────────────────────

@router.post("/create-checkout-session", summary="Create Stripe Checkout Session")
async def create_checkout_session(
    data: CheckoutRequest,
    current_user=Depends(get_current_user)
):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan. Choose PRO or ENTERPRISE.")

    if not stripe.api_key:
        # Dev mode: return mock session
        return {
            "url": f"{FRONTEND_URL}/admin/billing?mock=true&plan={data.plan}",
            "session_id": "mock_session_" + data.org_id,
            "dev_mode": True
        }

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": PLANS[data.plan], "quantity": 1}],
            success_url=f"{FRONTEND_URL}/admin/billing/success?session_id={{CHECKOUT_SESSION_ID}}&org={data.org_id}",
            cancel_url=f"{FRONTEND_URL}/admin/billing/cancel",
            metadata={
                "org_id": data.org_id,
                "org_name": data.org_name,
                "plan": data.plan,
                "user_id": current_user.get("sub"),
            },
            customer_email=current_user.get("email"),
            subscription_data={
                "metadata": {"org_id": data.org_id, "plan": data.plan}
            },
        )
        return {"url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Customer Portal ───────────────────────────────────────────────────────────

@router.post("/create-portal-session", summary="Create Stripe Customer Portal Session")
async def create_portal_session(
    data: PortalRequest,
    current_user=Depends(get_current_user)
):
    if not stripe.api_key:
        return {"url": f"{FRONTEND_URL}/admin/billing?mock=true", "dev_mode": True}

    try:
        session = stripe.billing_portal.Session.create(
            customer=data.stripe_customer_id,
            return_url=f"{FRONTEND_URL}/admin/billing",
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Webhook Handler ───────────────────────────────────────────────────────────

@router.post("/webhook", summary="Stripe Webhook receiver", include_in_schema=False)
async def stripe_webhook(request: Request, stripe_signature: Optional[str] = Header(None)):
    payload = await request.body()

    if not WEBHOOK_SECRET or not stripe.api_key:
        # Dev: just acknowledge
        return {"received": True, "dev_mode": True}

    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event_type = event["type"]
    data_obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        org_id = data_obj.get("metadata", {}).get("org_id")
        plan = data_obj.get("metadata", {}).get("plan")
        customer_id = data_obj.get("customer")
        subscription_id = data_obj.get("subscription")
        # TODO: Update DB — set org.plan=plan, org.stripe_customer_id=customer_id, etc.
        print(f"✅ Checkout complete: org={org_id} plan={plan} customer={customer_id}")

    elif event_type == "customer.subscription.updated":
        subscription_id = data_obj["id"]
        status = data_obj["status"]
        # TODO: Update org subscription_status in DB
        print(f"🔄 Subscription updated: {subscription_id} → {status}")

    elif event_type == "customer.subscription.deleted":
        subscription_id = data_obj["id"]
        # TODO: Downgrade org to FREE in DB
        print(f"❌ Subscription cancelled: {subscription_id}")

    elif event_type == "invoice.payment_failed":
        customer_id = data_obj.get("customer")
        # TODO: Mark org as past_due, send notification
        print(f"⚠️ Payment failed for customer: {customer_id}")

    return {"received": True}


# ── Plans info (public) ───────────────────────────────────────────────────────

@router.get("/plans", summary="Get available subscription plans")
async def get_plans():
    return {
        "plans": [
            {
                "id": "FREE",
                "name": "Starter",
                "price_monthly": 0,
                "currency": "EUR",
                "features": [
                    "3 utilisateurs max",
                    "1 workspace",
                    "5 documents",
                    "Support communauté",
                ],
                "limits": {"users": 3, "workspaces": 1, "documents": 5},
                "stripe_price_id": None,
                "highlighted": False,
            },
            {
                "id": "PRO",
                "name": "Pro Clinique",
                "price_monthly": 49,
                "currency": "EUR",
                "features": [
                    "25 utilisateurs",
                    "Workspaces illimités",
                    "Documents illimités",
                    "AI agents (Ollama + GPT-4)",
                    "Export PDF/PPTX",
                    "Support prioritaire 48h",
                ],
                "limits": {"users": 25, "workspaces": -1, "documents": -1},
                "stripe_price_id": PLANS["PRO"],
                "highlighted": True,
            },
            {
                "id": "ENTERPRISE",
                "name": "Enterprise",
                "price_monthly": 199,
                "currency": "EUR",
                "features": [
                    "Utilisateurs illimités",
                    "Multi-sites / Multi-organes",
                    "SSO / SAML",
                    "Audit logs & RGPD",
                    "SLA 99.9%",
                    "Support dédié 24/7",
                    "Onboarding personnalisé",
                ],
                "limits": {"users": -1, "workspaces": -1, "documents": -1},
                "stripe_price_id": PLANS["ENTERPRISE"],
                "highlighted": False,
            },
        ]
    }
