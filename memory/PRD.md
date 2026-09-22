# FARLIGHT — PRD

## Problem Statement (originale)
Sito web professionale e moderno in ITALIANO per FARLIGHT (consulenza illuminotecnica da remoto di Alessia e Alessandra), con selettore multilingua IT/EN, hero con video, manifesto, punti di forza, modulo "Richiedi Concept Preliminare" con upload allegati (PDF/DWG/JPG/PNG), piani Stripe (€49 una tantum, €149/mese Studio Pro), escalation "Consulenza Diretta Studio", contatti. Stile: chiaro, pulito, sofisticato, originale — toni della luce, legno, verdi naturali.

## Risposte discovery (22/09/2026)
- Pagamenti: scelta delegata → implementato Stripe (claimable sandbox, Flow A)
- Video: l'utente ha file video da caricare → slot video pronti (/public/videos/presentazione.mp4, tutorial.mp4)
- Nessun dato numerico reale → headline su "veloce, economico, d'autore"
- Email contatti: segnaposto info@farlight.it (DA SOSTITUIRE)
- Lingua default: Italiano
- Edit visivi utente: rimosso "due mamme" dal Manifesto H2; rimosso "Veloce. Economica." dalla hero

## Architettura
- Backend: FastAPI + MongoDB (motor), Stripe SDK, Emergent object storage per allegati
- Frontend: React + Tailwind + shadcn/ui + framer-motion; font Cormorant Garamond + Manrope
- Palette: cream #FAFAFA, sand #F3EFE9, ink #2A2726, amber #D4A373, sage #8A9A5B, espresso #1A1817

## Implementato (22/09/2026)
- Home one-page: Header glass con selettore IT/EN, Hero con slot video, Manifesto, 4 Punti di forza, Video Tutorial (4 step + player), Form Concept con upload su object storage, Pricing con checkout Stripe (2 piani, disclaimer), Escalation con CTA che preseleziona topic nel form contatti, Footer/Contatti con form
- API: POST /api/concept-requests (multipart+upload), POST /api/contact-messages, POST /api/payments/checkout, GET /api/payments/status/{id}, POST /api/stripe/webhook, GET /api/files/{path}
- Stripe: catalogo creato (price farlight_occasional €49, farlight_studio_pro €149/mese), tax_mode=full (IT, SMP), webhook idempotente, fallback polling stato
- Pagine: /payment/success (polling stato), /payment/cancel
- Test: backend 8/8 via curl; UI e2e via Playwright (lingua EN/IT, form+upload, redirect Stripe, escalation, contatti, mobile 390px) — tutto verde

## Da fare / Backlog
- P0: Sostituire email info@farlight.it con email reale; caricare video presentazione.mp4 e tutorial.mp4 in /app/frontend/public/videos/
- P0: Completare claim sandbox Stripe (onboarding_url condiviso) per andare live
- P1: Notifiche email (Resend) su nuove richieste concept/contatti
- P1: Area admin per vedere richieste e scaricare allegati
- P2: Collegare pagamento → concept request (sblocco form dopo acquisto)
- P2: SEO metadata per pagina, sitemap
