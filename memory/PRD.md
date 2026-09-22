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
- Home one-page: Header glass con selettore 5 lingue (IT/EN/FR/DE/ES), Hero con slot video, Manifesto, 4 Punti di forza, Video Tutorial (4 step + player), Form Concept con upload su object storage, Cataloghi 32 brand selezionabili (i brand scelti finiscono nella richiesta), Pricing con checkout Stripe (2 piani, disclaimer), Escalation con CTA che preseleziona topic, Footer/Contatti con form
- Auth: Emergent Google sign-in + email/password (bcrypt + session cookie httpOnly), pagina /login, area personale /account protetta
- AI: a ogni richiesta concept, Claude Sonnet 4.6 genera anteprima testuale (lux, atmosfera, corpi illuminanti), GPT Image 1 genera moodboard; opzione "Abaco Lampade" con Claude + web_search (marca/modello/codice/link ufficiale per rivenditori); brand preselezionati dal sito inclusi nei prompt
- Report PDF firmato FArLight (reportlab) + versione editabile .md, entrambi scaricabili dall'area personale
- API: concept-requests (multipart+upload+AI), contact-messages, auth (register/login/session/me/logout), my/requests, payments (checkout/status/webhook), files/{path}
- Stripe: catalogo (€49, €149/mese), tax_mode=full (IT), webhook idempotente
- Test e2e: backend curl + Playwright (registrazione, login, submit, anteprima AI con testo+immagine, redirect Stripe, selezione brand→form, mobile)
- NOTA: budget Emergent LLM key esaurito ($1.30/$1.00) — generazioni AI e video Sora in pausa fino a ricarica
- PayPal: in attesa di Client ID/Secret dall'utente (developer.paypal.com)

## Da fare / Backlog
- P0: Sostituire email info@farlight.it con email reale; caricare video presentazione.mp4 e tutorial.mp4 in /app/frontend/public/videos/
- P0: Completare claim sandbox Stripe (onboarding_url condiviso) per andare live
- P1: Notifiche email (Resend) su nuove richieste concept/contatti
- P1: Area admin per vedere richieste e scaricare allegati
- P2: Collegare pagamento → concept request (sblocco form dopo acquisto)
- P2: SEO metadata per pagina, sitemap
