# NexaSolve Tech — React Rebuild

A ground-up React + Vite + Tailwind rebuild of the NexaSolve Tech portfolio
platform, connected to the existing, unmodified Supabase backend.

## Phase 1 — foundation
Routing, layout shells, Supabase client, shared component library.

## Phase 2 — public portfolio
Full public homepage: Navbar, Hero, About, Skills, Services, Projects
(search + category filter), Contact, Footer.

## Phase 3 (this phase) — enquiry, orders & tracking
- "Enquire" on a project opens a real form (name/email/message), inserts
  into the existing `orders` table with the exact columns the vanilla app
  uses, and shows the DB-generated tracking token on success.
- `/track` is now functional: manual token entry or `?track=CODE` in the
  URL, fetches the order + message thread via the existing
  `get_order_thread` RPC, and supports sending a follow-up via
  `client_send_message` — the same two RPCs the vanilla app already uses,
  so no direct `orders`/`messages` table access happens from the browser.

## Setup

```bash
npm install
```

`.env` is pre-filled with your real Supabase URL/anon key.

## Run

```bash
npm run dev
npm run build
npm run preview
```

## Routes

| Path | Page |
|---|---|
| `/` | Full public homepage |
| `/admin` | Placeholder (later phase) |
| `/track` | Tracking page — supports `?track=CODE` |
| `*` | 404 |
