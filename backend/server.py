from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone

import stripe
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ALLOWED_EXTENSIONS = {".pdf", ".dwg", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

# ---------------- Emergent object storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "farlight"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


MIME_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".pdf": "application/pdf", ".dwg": "application/octet-stream",
}

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------------- Stripe setup (Flow A: claimable sandbox) ----------------
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
payment_transactions = db["payment_transactions"]

SMP_COUNTRIES = {
    "AU", "AT", "BE", "BG", "CA", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GI", "GR", "HK", "HU", "IE", "IT", "JP", "LV", "LI", "LT", "LU",
    "MT", "NL", "NO", "PL", "PT", "RO", "SG", "SK", "SI", "ES", "SE", "CH",
    "GB", "US",
}
tax_mode = "calc_only"


@app.on_event("startup")
async def detect_tax_mode():
    global tax_mode
    try:
        country = stripe.Account.retrieve()["country"]
        if country in SMP_COUNTRIES:
            tax_mode = "full"
        logger.info(f"Stripe account country={country}, tax_mode={tax_mode}")
    except Exception as e:
        logger.warning(f"Could not detect Stripe account country: {e}")
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


# ---------------- Models ----------------
class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    topic: str = "support"
    message: str


class CheckoutRequest(BaseModel):
    lookup_key: str
    quantity: int = Field(1, ge=1, le=100)
    origin_url: str


ALLOWED_LOOKUP_KEYS = {"farlight_occasional", "farlight_studio_pro"}


# ---------------- Health ----------------
@api_router.get("/")
async def root():
    return {"message": "FARLIGHT API"}


# ---------------- Concept requests (multipart + uploads) ----------------
@api_router.post("/concept-requests")
async def create_concept_request(
    name: str = Form(...),
    email: str = Form(...),
    space_type: str = Form(...),
    surface: float = Form(...),
    ceiling_height: float = Form(...),
    budget_range: str = Form(...),
    light_style: str = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    saved_files = []
    for f in files:
        ext = Path(f.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(400, f"Formato file non supportato: {ext}")
        content = await f.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(400, f"File troppo grande (max 20MB): {f.filename}")
        content_type = f.content_type or MIME_TYPES.get(ext, "application/octet-stream")
        path = f"{APP_NAME}/uploads/concepts/{uuid.uuid4().hex}{ext}"
        result = put_object(path, content, content_type)
        saved_files.append({
            "original_name": f.filename,
            "storage_path": result["path"],
            "size": result.get("size", len(content)),
            "content_type": content_type,
        })

    doc = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "space_type": space_type,
        "surface": surface,
        "ceiling_height": ceiling_height,
        "budget_range": budget_range,
        "light_style": light_style,
        "notes": notes,
        "attachments": saved_files,
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.concept_requests.insert_one(doc)
    return {"id": doc["id"], "status": "ok"}


# ---------------- Contact / direct consultation ----------------
@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.concept_requests.find_one({"attachments.storage_path": path}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File non trovato")
    attachment = next(a for a in record["attachments"] if a["storage_path"] == path)
    data, content_type = get_object(path)
    from fastapi.responses import Response
    return Response(content=data, media_type=attachment.get("content_type", content_type))


@api_router.post("/contact-messages")
async def create_contact_message(msg: ContactMessage):
    doc = msg.model_dump()
    doc.update({
        "id": str(uuid.uuid4()),
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.contact_messages.insert_one(doc)
    return {"id": doc["id"], "status": "ok"}


# ---------------- Stripe payments ----------------
@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest):
    if req.lookup_key not in ALLOWED_LOOKUP_KEYS:
        raise HTTPException(400, "Piano non valido")
    prices = stripe.Price.list(lookup_keys=[req.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, f"Prezzo non trovato: {req.lookup_key}")
    price = prices[0]
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": req.quantity}],
        mode="subscription" if price.recurring else "payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        metadata={"lookup_key": req.lookup_key},
    )
    if tax_mode == "full":
        try:
            session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
        except stripe.error.InvalidRequestError as e:
            msg = (e.user_message or "").lower()
            if "managed payments" in msg or "ineligible" in msg:
                session = stripe.checkout.Session.create(
                    **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required",
                )
            else:
                raise
    else:
        session = stripe.checkout.Session.create(
            **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required",
        )
    await payment_transactions.insert_one({
        "session_id": session.id,
        "lookup_key": req.lookup_key,
        "amount": float((price.unit_amount or 0) * req.quantity) / 100.0,
        "currency": price.currency,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    record = await payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Transazione non trovata")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed", "payment_status": "paid",
                        "stripe_subscription_id": s.subscription,
                        "stripe_payment_intent_id": s.payment_intent,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                record = await payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except stripe.error.StripeError:
            pass
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "lookup_key": record.get("lookup_key"),
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    now = datetime.now(timezone.utc).isoformat()
    if t == "checkout.session.completed":
        await payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": obj.get("payment_status", "paid"),
                      "stripe_subscription_id": obj.get("subscription"),
                      "stripe_payment_intent_id": obj.get("payment_intent"),
                      "updated_at": now}},
        )
    elif t == "checkout.session.async_payment_succeeded":
        await payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"payment_status": "paid", "updated_at": now}})
    elif t == "checkout.session.async_payment_failed":
        await payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": now}})
    elif t == "checkout.session.expired":
        await payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": now}})
    elif t == "charge.refunded":
        await payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": now}})
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
