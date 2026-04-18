
Building all 5 nonprofit CRM enhancements. Order chosen so each builds on the prior data.

## 1. Donor Segmentation & Retention
- New hook `useCrmDonorAnalytics(orgId)` — pulls all donations, groups by contact, computes:
  - **Major Donor**: lifetime giving ≥ $1,000 (configurable later)
  - **Sustaining**: any `is_recurring = true` donation
  - **LYBUNT**: gave last calendar year, not this year
  - **SYBUNT**: gave any prior year, not this year
  - **New donor this year**, **Lapsed** (no gift in 24+ months)
  - **Retention rate**: % of last year's donors who gave again this year
- New component `DonorSegmentsDashboard.tsx` — 6 segment cards + a "View list" drawer that shows matching contacts and lets the user bulk-add them to a CRM list (uses existing `addContactToList`).
- Add a new tab "Segments" in `CrmDashboard`.

## 2. Acknowledgments & Year-End Tax Statements
- DB: already have `acknowledgment_sent` / `acknowledgment_sent_at` on `crm_donations`. No schema change.
- New component `AcknowledgmentsManager.tsx`:
  - Filterable table of donations where `acknowledgment_sent = false`
  - "Mark as acknowledged" (single + bulk) updates the row
  - "Send thank-you email" button → calls new edge function `send-donation-acknowledgment` (uses Lovable Email infra)
- New edge function `generate-giving-statement`:
  - Input: `contact_id`, `year`
  - Queries `crm_donations` for that contact + year, generates a PDF (using `pdf-lib` from esm.sh), returns base64
  - Frontend downloads it
- Add "Tax Statement" button on `ContactProfile` Donations tab → year picker → download
- Add tab "Acknowledgments" inside the Donations tab area (sub-tabs).

→ **Email infra**: Need to check email domain status before scaffolding the thank-you function. Will trigger setup dialog if not configured.

## 3. Constituent 360 Timeline
- New hook `useConstituent360(contactId, orgId)` — parallel-fetches `crm_donations`, `crm_volunteer_hours`, `crm_interactions`, `crm_notes` for the contact, normalizes each to `{ id, type, date, title, description, icon, color, metadata }`, sorts desc by date.
- New component `ConstituentTimeline.tsx` — vertical timeline with type filter chips (All / Donations / Hours / Interactions / Notes), color-coded markers, expandable details.
- Add as the first tab in `ContactProfile` (replaces "Overview" position; Overview becomes second).

## 4. Grant Pipeline
- DB migration — new tables:
  ```
  crm_grants (
    id, organization_id, foundation_name, grant_name, amount_requested,
    amount_awarded, stage, deadline, submitted_date, decision_date,
    contact_id (FK crm_contacts, nullable — the program officer),
    owner_id (FK auth.users), notes, created_at, updated_at
  )
  ```
  - `stage` enum: `researching | loi | proposal_drafting | submitted | awarded | declined | reporting | closed`
  - RLS: same org-admin pattern as other crm_ tables
- New hook `useCrmGrants(orgId)` — full CRUD.
- New components:
  - `GrantPipelineKanban.tsx` — reuse `@dnd-kit` (already installed for tasks/calendar) with columns per stage, drag to update stage
  - `GrantFormDialog.tsx` — create/edit
  - `GrantDetailDialog.tsx` — full record + linked contact + deadline countdown
- New tab "Grants" in `CrmDashboard`.

## 5. Stripe → CRM Donation Sync
- New edge function `stripe-donation-webhook`:
  - Verifies Stripe webhook signature using `STRIPE_SECRET_KEY` (already in secrets) + new `STRIPE_WEBHOOK_SECRET`
  - On `payment_intent.succeeded` and `charge.succeeded`:
    - Look up `crm_contacts` by email (case-insensitive); auto-create lead if missing
    - Insert into `crm_donations` with `transaction_id = stripe_id`, `payment_method = 'stripe'`, `amount`, `donation_date`, currency
    - Detect recurring: if linked to a subscription, set `is_recurring = true`, `recurrence_frequency` from price interval
    - Use Stripe metadata `organization_id` to route to correct org (required), and optional `campaign_id`
  - Idempotent — skip if `transaction_id` already exists
  - `verify_jwt = false` in config.toml
- New component `StripeWebhookSettings.tsx` (in CRM Settings area):
  - Shows the webhook URL to paste into Stripe Dashboard
  - Shows last 20 sync events from a small new log table OR queried from `crm_donations` filtered by `payment_method='stripe'`
- Add small section under Donations tab "Auto-sync from Stripe" with status + URL.

→ **Need from user**: `STRIPE_WEBHOOK_SECRET` (will request via add_secret after they confirm).

## Files

**New components**: `DonorSegmentsDashboard.tsx`, `AcknowledgmentsManager.tsx`, `ConstituentTimeline.tsx`, `GrantPipelineKanban.tsx`, `GrantFormDialog.tsx`, `GrantDetailDialog.tsx`, `StripeWebhookSettings.tsx`

**New hooks**: `useCrmDonorAnalytics.ts`, `useConstituent360.ts`, `useCrmGrants.ts`

**Edge functions**: `send-donation-acknowledgment`, `generate-giving-statement`, `stripe-donation-webhook`

**Edited**: `CrmDashboard.tsx` (3 new tabs), `ContactProfile.tsx` (timeline + tax statement button), `DonationsManager.tsx` (acknowledgments sub-section)

**Migration**: `crm_grants` table + RLS

## Order of execution
1. Donor segmentation (no deps) → 2. Constituent 360 (no deps) → 3. Grant pipeline (migration) → 4. Acknowledgments + tax PDF (needs email domain check first) → 5. Stripe webhook (needs webhook secret)

I'll pause before #4 to handle email domain setup if needed, and before #5 to request the Stripe webhook secret.
