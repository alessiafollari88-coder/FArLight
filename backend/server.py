from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Request, Response, BackgroundTasks
from fastapi.responses import Response as RawResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

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


# ---------------- Auth (Google OAuth + email/password) ----------------
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleSessionRequest(BaseModel):
    session_id: str


async def create_session(user_id: str) -> str:
    token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return token


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        "session_token", token, path="/", secure=True,
        httponly=True, samesite="none", max_age=7 * 24 * 3600,
    )


async def get_session_user(request: Request):
    token = request.cookies.get("session_token")
    auth = request.headers.get("Authorization", "")
    if not token and auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    return await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})


@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email già registrata")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    await db.users.insert_one({
        "user_id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "picture": None,
        "auth_provider": "password",
        "password_hash": bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    token = await create_session(user_id)
    set_session_cookie(response, token)
    return {"user_id": user_id, "email": req.email.lower(), "name": req.name}


@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not user.get("password_hash"):
        raise HTTPException(401, "Credenziali non valide")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(401, "Credenziali non valide")
    token = await create_session(user["user_id"])
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture")}


@api_router.post("/auth/session")
async def exchange_google_session(req: GoogleSessionRequest, response: Response):
    r = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": req.session_id}, timeout=15,
    )
    if r.status_code != 200:
        raise HTTPException(401, "Sessione Google non valida")
    data = r.json()
    email = data["email"].lower()
    user = await db.users.find_one({"email": email})
    if user:
        user_id = user["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {
            "name": data.get("name") or user.get("name"),
            "picture": data.get("picture") or user.get("picture"),
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "picture": data.get("picture"),
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    token = await create_session(user_id)
    set_session_cookie(response, token)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return user


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(401, "Non autenticato")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"status": "ok"}


@api_router.get("/my/requests")
async def my_requests(request: Request):
    user = await get_session_user(request)
    if not user:
        raise HTTPException(401, "Non autenticato")
    items = await db.concept_requests.find(
        {"$or": [{"user_id": user["user_id"]}, {"email": user["email"]}]},
        {"_id": 0},
    ).sort("created_at", -1).to_list(100)
    return items


# ---------------- AI preview generation (Claude + image + PDF report) ----------------
def _clean_md_lines(text: str):
    import re
    lines = []
    for line in (text or "").splitlines():
        line = line.strip()
        if not line or set(line) <= {"-"}:
            continue
        line = re.sub(r"^#+\s*", "", line)
        line = line.replace("**", "").replace("*", "")
        lines.append(line)
    return lines


def build_report_pdf(data: dict, preview_text: str, lamp_schedule: str = None) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import ParagraphStyle
    from xml.sax.saxutils import escape
    import io

    INK = HexColor("#2A2726")
    AMBER = HexColor("#B8875A")
    SAND = HexColor("#F3EFE9")
    MUTED = HexColor("#5C5855")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
        title="FArLight — Concept Illuminotecnico Preliminare", author="FArLight",
    )
    brand = ParagraphStyle("brand", fontName="Helvetica-Bold", fontSize=22, textColor=INK)
    h1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=17, textColor=INK, spaceAfter=6)
    sub = ParagraphStyle("sub", fontName="Helvetica", fontSize=9, textColor=MUTED)
    body = ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, leading=16, textColor=INK, spaceAfter=6)
    small = ParagraphStyle("small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=MUTED)

    story = [
        Paragraph('FAr<font color="#B8875A">Light</font>', brand),
        Paragraph("Consulenza illuminotecnica da remoto", sub),
        Spacer(1, 6),
        HRFlowable(width="100%", thickness=1, color=AMBER),
        Spacer(1, 14),
        Paragraph("Concept Illuminotecnico Preliminare", h1),
        Paragraph(
            f"Preparato per <b>{escape(data['name'])}</b> — {datetime.now(timezone.utc).strftime('%d/%m/%Y')}", sub
        ),
        Spacer(1, 12),
    ]
    table_data = [
        ["Tipologia di spazio", escape(str(data["space_type"]).capitalize())],
        ["Superficie", f"{data['surface']} mq"],
        ["Altezza soffitto", f"{data['ceiling_height']} m"],
        ["Fascia di budget", escape(str(data["budget_range"]).capitalize())],
        ["Stile preferito", escape(str(data["light_style"]))],
    ]
    if data.get("notes"):
        table_data.append(["Note di cantiere", escape(str(data["notes"]))])
    tbl = Table(table_data, colWidths=[45 * mm, 125 * mm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), SAND),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 16))
    for line in _clean_md_lines(preview_text):
        story.append(Paragraph(escape(line), body))
    if lamp_schedule:
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.5, color=AMBER))
        story.append(Spacer(1, 10))
        story.append(Paragraph("Abaco Lampade — per Rivenditori e Distributori", h1))
        for line in _clean_md_lines(lamp_schedule):
            story.append(Paragraph(escape(line), body))
        story.append(Spacer(1, 8))
        story.append(Paragraph(
            "Foto, codici articolo e schede tecniche complete sono disponibili sulle pagine ufficiali dei produttori "
            "linkate. Il capitolato ufficiale con prezzi e sconti sarà redatto autonomamente da distributori e "
            "rivenditori di zona, indipendentemente da FArLight.", small,
        ))
    story += [
        Spacer(1, 16),
        HRFlowable(width="100%", thickness=0.5, color=AMBER),
        Spacer(1, 8),
        Paragraph(
            "Questo report costituisce una Consulenza Preliminare di Concept e Fattibilità Illuminotecnica "
            "per guidare le scelte iniziali e stimare i costi. Le stime di illuminamento (lux) sono indicative "
            "e soggette a verifica progettuale.", small,
        ),
        Spacer(1, 10),
        Paragraph("Firmato <b>FArLight</b> — Alessia &amp; Alessandra", body),
    ]
    doc.build(story)
    return buf.getvalue()


def build_report_editable(data: dict, preview_text: str, lamp_schedule: str = None) -> bytes:
    lines = [
        "# FArLight — Concept Illuminotecnico Preliminare",
        "",
        f"Cliente: {data['name']}",
        f"Data: {datetime.now(timezone.utc).strftime('%d/%m/%Y')}",
        f"Tipologia: {data['space_type']} | Superficie: {data['surface']} mq | Soffitto: {data['ceiling_height']} m",
        f"Budget: {data['budget_range']} | Stile: {data['light_style']}",
    ]
    if data.get("notes"):
        lines.append(f"Note: {data['notes']}")
    lines += ["", "---", ""]
    lines += _clean_md_lines(preview_text)
    if lamp_schedule:
        lines += ["", "---", "", "## Abaco Lampade — per Rivenditori e Distributori", ""]
        lines += _clean_md_lines(lamp_schedule)
        lines += ["", "Foto, codici e schede tecniche: vedi le pagine ufficiali dei produttori linkate. "
                  "Prezzi e sconti del capitolato ufficiale sono decisi autonomamente dai rivenditori, indipendentemente da FArLight."]
    lines += [
        "",
        "---",
        "Questo report costituisce una Consulenza Preliminare di Concept e Fattibilità Illuminotecnica.",
        "Firmato FArLight — Alessia & Alessandra",
    ]
    return "\n".join(lines).encode("utf-8")


async def generate_ai_preview(request_id: str, data: dict):
    try:
        await db.concept_requests.update_one({"id": request_id}, {"$set": {"ai_status": "generating"}})
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

        prompt = (
            f"Richiesta concept illuminotecnico preliminare. Tipologia spazio: {data['space_type']}. "
            f"Superficie: {data['surface']} mq. Altezza soffitto: {data['ceiling_height']} m. "
            f"Fascia budget: {data['budget_range']}. Stile preferito: {data['light_style']}. "
            f"Note e vincoli: {data.get('notes') or 'nessuna'}. "
            + (
                f"Il cliente ha già selezionato questi brand preferiti dai cataloghi: {', '.join(data['preferred_brands'])}. "
                "Tienine conto nei suggerimenti. "
                if data.get("preferred_brands") else ""
            )
            + "Scrivi in italiano un concept preliminare di 150-200 parole: atmosfera luminosa consigliata, "
            "stima indicativa dei lux target per l'ambiente, 2-3 suggerimenti di corpi illuminanti e "
            "temperature colore consigliate. Tono professionale ma accessibile. "
            "Concludi con una riga: 'Stima preliminare indicativa, da verificare con il report completo FArLight.'"
        )
        chat = LlmChat(
            api_key=os.environ["EMERGENT_LLM_KEY"],
            session_id=f"concept-{request_id}",
            system_message="Sei una lighting designer senior dello studio FArLight. Rispondi solo con il testo del concept, senza preamboli.",
        ).with_model("anthropic", "claude-sonnet-4-6")
        preview_text = ""
        async for ev in chat.stream_message(UserMessage(text=prompt)):
            if isinstance(ev, TextDelta):
                preview_text += ev.content
            elif isinstance(ev, StreamDone):
                break

        lamp_schedule = None
        if data.get("include_lamp_schedule"):
            try:
                lamp_prompt = (
                    f"Per un progetto {data['space_type']} di {data['surface']} mq, stile {data['light_style']}, "
                    f"budget {data['budget_range']}: cerca sul web e componi un abaco lampade con 5-8 corpi illuminanti "
                    + (
                        f"privilegiando questi brand scelti dal cliente: {', '.join(data['preferred_brands'])}. "
                        if data.get("preferred_brands") else ""
                    )
                    + "REALI attualmente in commercio di marchi noti (es. Flos, Artemide, Foscarini, Luceplan, Delta Light, "
                    "iGuzzini, Louis Poulsen, Occhio, Nemo, Vibia). Per ogni lampada scrivi in italiano, una per riga, nel formato: "
                    "Marca — Modello — Tipologia — Codice articolo/riferimento catalogo — Link pagina ufficiale del prodotto. "
                    "Solo prodotti verificati tramite ricerca web, con link reale alla pagina ufficiale. Nessun preambolo."
                )
                lamp_chat = LlmChat(
                    api_key=os.environ["EMERGENT_LLM_KEY"],
                    session_id=f"lamps-{request_id}",
                    system_message="Sei una lighting designer senior di FArLight. Usa la ricerca web e rispondi solo con l'elenco richiesto.",
                ).with_model("anthropic", "claude-sonnet-4-6").with_tools(
                    [{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}]
                )
                lamp_schedule = ""
                async for ev in lamp_chat.stream_message(UserMessage(text=lamp_prompt)):
                    if isinstance(ev, TextDelta):
                        lamp_schedule += ev.content
                    elif isinstance(ev, StreamDone):
                        break
            except Exception as lamp_err:
                logger.warning(f"Lamp schedule generation failed for {request_id}: {lamp_err}")

        image_path = None
        try:
            from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
            gen = OpenAIImageGeneration(api_key=os.environ["EMERGENT_LLM_KEY"])
            img_prompt = (
                f"Elegant interior photography moodboard for a {data['space_type']} space of {data['surface']} sqm, "
                f"lighting style: {data['light_style']}. Warm architectural lighting, editorial quality, "
                "sophisticated Italian design atmosphere, soft shadows."
            )
            images = await gen.generate_images(prompt=img_prompt, model="gpt-image-1", number_of_images=1, quality="low")
            if images:
                image_path = f"{APP_NAME}/generated/{request_id}.png"
                put_object(image_path, images[0], "image/png")
        except Exception as img_err:
            logger.warning(f"AI image generation failed for {request_id}: {img_err}")

        pdf_path = None
        editable_path = None
        try:
            pdf_bytes = build_report_pdf(data, preview_text, lamp_schedule)
            pdf_path = f"{APP_NAME}/generated/{request_id}.pdf"
            put_object(pdf_path, pdf_bytes, "application/pdf")
            editable_path = f"{APP_NAME}/generated/{request_id}.md"
            put_object(editable_path, build_report_editable(data, preview_text, lamp_schedule), "text/markdown")
        except Exception as pdf_err:
            logger.warning(f"PDF report generation failed for {request_id}: {pdf_err}")

        await db.concept_requests.update_one(
            {"id": request_id},
            {"$set": {
                "ai_preview_text": preview_text,
                "ai_lamp_schedule": lamp_schedule,
                "ai_image_path": image_path,
                "pdf_path": pdf_path,
                "editable_path": editable_path,
                "ai_status": "ready",
                "ai_generated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
    except Exception as e:
        logger.error(f"AI preview generation failed for {request_id}: {e}")
        await db.concept_requests.update_one({"id": request_id}, {"$set": {"ai_status": "error"}})


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
    request: Request,
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: str = Form(...),
    space_type: str = Form(...),
    surface: float = Form(...),
    ceiling_height: float = Form(...),
    budget_range: str = Form(...),
    light_style: str = Form(...),
    notes: str = Form(""),
    include_lamp_schedule: str = Form("false"),
    preferred_brands: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    user = await get_session_user(request)
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
        "user_id": user["user_id"] if user else None,
        "name": name,
        "email": email,
        "space_type": space_type,
        "surface": surface,
        "ceiling_height": ceiling_height,
        "budget_range": budget_range,
        "light_style": light_style,
        "notes": notes,
        "include_lamp_schedule": include_lamp_schedule.lower() == "true",
        "preferred_brands": [b.strip() for b in preferred_brands.split(",") if b.strip()],
        "attachments": saved_files,
        "status": "new",
        "ai_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.concept_requests.insert_one(doc)
    background_tasks.add_task(generate_ai_preview, doc["id"], {
        "space_type": space_type, "surface": surface, "ceiling_height": ceiling_height,
        "budget_range": budget_range, "light_style": light_style, "notes": notes,
        "include_lamp_schedule": include_lamp_schedule.lower() == "true",
        "preferred_brands": [b.strip() for b in preferred_brands.split(",") if b.strip()],
    })
    return {"id": doc["id"], "status": "ok", "ai_status": "pending"}


# ---------------- Contact / direct consultation ----------------
@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.concept_requests.find_one(
        {"$or": [
            {"attachments.storage_path": path},
            {"ai_image_path": path},
            {"pdf_path": path},
            {"editable_path": path},
        ]},
        {"_id": 0},
    )
    if not record:
        raise HTTPException(404, "File non trovato")
    attachment = next((a for a in record.get("attachments", []) if a["storage_path"] == path), None)
    if attachment:
        content_type = attachment.get("content_type")
        filename = attachment.get("original_name", "file")
    elif record.get("pdf_path") == path:
        content_type, filename = "application/pdf", f"FArLight-Concept-{record['id'][:8]}.pdf"
    elif record.get("editable_path") == path:
        content_type, filename = "text/markdown", f"FArLight-Concept-{record['id'][:8]}-editabile.md"
    else:
        content_type, filename = "image/png", f"FArLight-Moodboard-{record['id'][:8]}.png"
    data, storage_ct = get_object(path)
    return RawResponse(
        content=data,
        media_type=content_type or storage_ct,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


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
