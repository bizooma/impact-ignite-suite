

# BridgeTRUST Mobile App Integration Plan

Hybrid architecture: BridgeTRUST's content lives in Causeio (this platform). Their Dreamflow app calls public edge functions authenticated with a per-org API key. Donations and volunteers reuse existing CRM. Events and Success Stories get new tables + admin UI.

## 1. Database (migration)

**New columns on `organizations`:**
- `mobile_api_key text unique` — opaque random token (e.g. `mob_live_<32 hex>`)
- `mobile_api_enabled boolean default false`

**New table `org_events`:**
- id, organization_id, title, description, location, starts_at, ends_at, image_url, capacity (nullable), is_published, created_at, updated_at
- RLS: org admins manage, org members view

**New table `org_event_rsvps`:**
- id, event_id, name, email, phone (nullable), guests int default 1, notes, created_at
- RLS: public insert (mobile app), org members view

**New table `org_success_stories`:**
- id, organization_id, title, slug, summary, body (rich text/markdown), hero_image_url, gallery (jsonb array), video_url, category, tags (text[]), author_name, is_featured, is_published, published_at, created_at, updated_at
- RLS: org admins manage; **public select where `is_published = true`** (mobile app reads via anon — but we'll route through edge fn for consistency + API-key gating)

## 2. Edge functions (all public, `verify_jwt = false`)

All resolve org from `x-mobile-api-key` header → `organizations.mobile_api_key`. Reject if missing/disabled.

| Function | Method | Purpose |
|---|---|---|
| `mobile-events` | GET | List published upcoming events for the org |
| `mobile-events-rsvp` | POST | Create RSVP for an event (validates event belongs to org) |
| `mobile-stories` | GET | List published success stories (supports `?featured=true`, `?slug=`) |
| `mobile-donate` | POST | Create `crm_contacts` (match by email) + `crm_donations` row; returns success. Optionally creates Stripe payment intent if Stripe Connect configured (phase 2) |
| `mobile-volunteer` | POST | Wraps existing `submit-volunteer` logic but org-scoped via API key (existing function is chatbot-scoped) |

All include CORS, zod validation, basic in-memory rate limiting per API key.

## 3. Admin UI additions

**New section in `AppSidebar` → "Mobile Content"** (org-scoped, admin only):
- Events manager (`src/components/mobile-content/EventsManager.tsx`) — table + create/edit dialog + RSVPs viewer per event
- Success Stories manager (`src/components/mobile-content/StoriesManager.tsx`) — list + rich editor dialog (reuse Textarea + image upload to `media-assets` bucket; gallery picker)
- API Settings panel (`src/components/mobile-content/MobileApiSettings.tsx`) — show/regenerate `mobile_api_key`, toggle `mobile_api_enabled`, copy snippet showing endpoint URLs + header format for Dreamflow

Donations and volunteers from the mobile app surface automatically in the existing **CRM → Donations** and **CRM → Volunteer Hours** tabs (they're just normal `crm_donations` / `crm_volunteer_hours` rows with `source = 'mobile_app'`).

## 4. Dreamflow integration docs

Generate a one-page Markdown reference (shown in Mobile API Settings panel) listing:
- Base URL: `https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/`
- Required header: `x-mobile-api-key: <key>`
- Endpoint reference with example request/response JSON for each of the 5 functions

## 5. Order of build

1. Migration (tables + org columns)
2. `MobileApiSettings` component + key generation (so you can grab a key for Dreamflow testing)
3. Events: edge functions + EventsManager UI
4. Success Stories: edge functions + StoriesManager UI
5. Donate + Volunteer edge functions (no new UI — flows into CRM)
6. Sidebar entry + route wiring

## Notes

- No separate Supabase needed for BridgeTRUST. Everything is org-scoped in your existing DB.
- API key is per-org so revoking only affects that org's mobile app.
- Stripe payment for donations is deferred to phase 2 — initial `mobile-donate` records the donation as `pending` so they can confirm via existing CRM tools, or we wire Stripe Connect in a follow-up.
- Success Stories rich content stored as markdown; render in mobile app with any markdown lib in Dreamflow.
- Once built, the same pattern works for any future org wanting a Dreamflow/native app — just flip on `mobile_api_enabled` and share the key.

