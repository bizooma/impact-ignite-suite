# Pre-Launch Functionality Audit & Fix

## Goal
Verify every launch-critical module works end-to-end with real data — no mock data, no hardcoding, no dead buttons — across Core, Marketing tools, and CRM/Donations. GBP and AccessNotify are intentionally left as-is per your decision.

## What I already found
A full scan turned up surprisingly little mock data. The only simulated/stubbed logic is:
- `gbp-sync` (random fake metrics) — **leaving as-is**
- AccessNotify email/SMS/voice services + hardcoded recipients — **leaving as-is**

One thing worth a decision (see Open Items): `index.html` loads the ADA widget from `https://causeio.com/accessibility.js`, while the app publishes to `impact-ignite-suite.lovable.app`. That hardcoded external domain may be correct (your production domain) or may need to point at the local `public/accessibility.js`.

## Audit method (per module)
For each module I will trace the full path: UI component → hook → Supabase query/edge function → table/RLS → back to UI. I'll fix anything that is broken, mocked, hardcoded, or silently failing, and confirm error/empty/loading states are handled. I will lean on the DB linter, edge-function logs, and read-only queries to verify real data flows.

### 1. Core (auth, orgs, billing, dashboard)
- Auth: signup/login/signout, org provisioning on signup, password reset path.
- Org switching, membership roles, invitations (`send-invitation`, `accept-invitation`).
- Billing: `create-checkout`, `check-subscription`, `customer-portal`, pricing → Stripe price IDs wiring, owner-vs-admin billing rules.
- Main dashboard stats and product-access gating (real counts, no placeholders). Confirm the "Coming Soon" tiles are intentional and clearly labeled, not broken links.

### 2. Marketing tools
- Chatbot: builder, FAQ manager, knowledge upload/processing, widget config, chat-handler responses.
- QR codes: generation, redirect tracking, analytics, branding.
- Social: composer, scheduling, OAuth connectors (Facebook/LinkedIn), `social-publisher`.
- SEO audits: `seo-audit` run + results, monthly quota.
- Campaigns: brief wizard, milestones, assets, dashboard stats (already confirmed real).
- Brand kit: colors/logos/typography/voice, PDF import.

### 3. CRM & Donations
- Contacts, lists (count triggers), segments, donations, volunteer hours, grants, acknowledgments.
- Mailchimp sync (`sync-crm-to-mailchimp`, `test-mailchimp-connection`, webhook handler).
- Quota enforcement and RLS scoping to org.

## Fixes
Applied inline as discovered. Each fix stays within the relevant frontend/hook/edge-function layer. Database changes (only if an RLS or grant gap blocks real data) go through a migration for your approval. No schema changes are expected unless the audit surfaces a genuine access bug.

## Verification
- Supabase DB linter for RLS/grant gaps on launch-critical tables.
- Read-only queries + edge-function logs to confirm real data and successful calls.
- Build stays green after each change.
- Final report: a per-module checklist of what was verified, what was fixed, and anything still requiring your input (e.g., third-party credentials).

## Open items needing your decision
1. ADA widget script domain in `index.html` (`causeio.com` vs published Lovable domain) — confirm which is correct.
2. Any module here that is *not* meant to ship this week, so I can skip it.

## Out of scope (your call)
- Google Business Profile real API integration (stays simulated).
- AccessNotify real email/SMS/voice delivery (stays mocked).
