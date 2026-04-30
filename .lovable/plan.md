
# Platform Audit & Fix Plan

I went through every app, page, dashboard, hook, and edge function. The platform is in much better shape than your message implies — there is **no fake/seed data being rendered as if it were real** in any user-facing analytics or list view. All dashboards (Analytics, Campaign Analytics, Chatbot Analytics, Platform Analytics, CRM, Tasks, GBP, etc.) query Supabase for real records.

However, I found **5 real issues** that are causing apps to feel "broken" or "off-limits", plus a handful of cosmetic/UX fixes. Here's what to fix.

---

## Issue 1 — Most orgs are locked out of most apps (CRITICAL)

`organizations.purchased_products` controls which apps each org can open via `ProtectedProductRoute`. Today every org in the database has the same minimal set:

```
[qr_codes, seo_audits, accessibility, tasks]
```

…even **Bizooma** and **Bizooma Foundation**, which both have `subscription_tier='enterprise'`. A migration on 2026‑04‑24 (`20260424185844_…`) reset everyone to that bundle, and the `check-subscription` Stripe sync only re-derives the bundle when a subscription event fires for the org owner's email — so manual tier changes never repopulate the bundle.

You don't notice it because `useProductAccess.hasAccess()` short‑circuits to `true` for platform admins. Anyone else hitting `/dashboard/chatbots`, `/social`, `/crm`, `/campaigns`, `/gbp`, `/mobile-app`, or `/analytics` on Bizooma sees the upgrade wall.

**Fix:**
- Migration that re-syncs `purchased_products` from `subscription_tier` for every org using `TIER_PRODUCT_BUNDLES`, while preserving any product already present that isn't a managed product (manual grants).
- Add a DB trigger on `organizations` that, whenever `subscription_tier` changes, refreshes `purchased_products` to `tier_bundle ∪ manual_grants`. This is what the `check-subscription` function expects to happen and prevents this drift from recurring.

## Issue 2 — Dashboard mislabels working apps as "In Development"

`src/components/dashboard/MainDashboard.tsx` hard-codes `ready: false` on these tiles, which then renders a red dot under the heading "In Development":

- Chatbots
- Social Media
- Google Business
- Campaigns
- Accessibility Widget

All five are fully wired to real database tables and edge functions. The `ready` flag is a leftover from early scaffolding.

**Fix:** Set `ready: true` on every shipped app. Remove the "In Development" sub-heading (there are no in-development modules left in `activeModules`).

## Issue 3 — Hardcoded "System Health: 100%" on Admin dashboard

`supabase/functions/admin-actions/index.ts` returns `systemHealth: 100` as a constant. The admin card shows a static green "100% — All systems operational" regardless of state.

**Fix:** Either compute it from a real signal (e.g. % of recent edge-function invocations with status < 500 in the last 15 minutes) or remove the card. Recommend **removing the card** and replacing it with something useful — count of pending join requests, beta signups awaiting provisioning, or unread support messages.

## Issue 4 — Integrations dashboard exposes a developer-only form

`src/components/integrations/IntegrationsDashboard.tsx` asks the user to paste raw JSON into `config` and `encrypted_tokens` text areas. This is unusable for a non-technical org admin and there's already a real per-provider integrations panel (`SocialIntegrationsPanel`, `MailchimpSyncSettings`, `StripeConnectSettings`, `GbpSetupGuide`, `MobileApiSettings`).

**Fix:** Replace the contents of the `/integrations` route with a hub page that links to each real integration panel grouped by category (Social, Email/CRM, Payments, Google Business, Mobile App, Accessibility). Drop the raw JSON form entirely — keep `useIntegrations` for legacy data display but surface entries read‑only with a "Configure in <Module>" link.

## Issue 5 — Twitter / X publishing UI shipped but not implemented

`PostComposer` and `SocialIntegrationsPanel` show a Twitter option marked `disabled` with "coming soon" copy. Either remove it or hide it behind a feature flag. Showing disabled UI in a production app reads as broken.

**Fix:** Remove all Twitter UI from `SocialIntegrationsPanel`, `PostComposer`, and `SocialMediaDashboard` filter panel until the publisher supports it. Same treatment for the `page_structure` accessibility toggle (`SiteSettingsPanel.tsx`) which is labelled "(coming soon)".

---

## Smaller cleanups bundled in

- `src/components/ui/sidebar.tsx:536` uses `Math.random()` to set a skeleton width per render — flickers on every re-render. Replace with a deterministic value derived from the item index.
- `useFlipbooks.ts` and `FlipbookManager.tsx` use `Math.random().toString(36)` to mint storage filenames — collision-prone. Use `crypto.randomUUID()` instead.
- `ChatbotAnalytics.tsx` swallows errors when querying the `volunteers` table (`return 0` on failure). Surface a toast or at least keep the existing console error so issues don't disappear silently.
- The `Bizooma Foundation` org you added me to has zero data and an enterprise tier. Confirmed it's a stray duplicate per our earlier conversation. Leaving it as-is per your decision; flagging only because Issue 1's migration will give it the full enterprise bundle.

---

## Technical details

**New migration** (single file):

```text
1. Backfill purchased_products from subscription_tier for every org:
     UPDATE organizations SET purchased_products =
       (tier_bundle(subscription_tier) || preserved_manual_grants)
2. Create function sync_org_products() that builds the merged bundle.
3. Create trigger on BEFORE UPDATE OF subscription_tier ON organizations
   that calls sync_org_products() to keep them aligned going forward.
4. Also fire the trigger on INSERT so new orgs get the right bundle.
```

**Code changes** (file-level):

```text
src/components/dashboard/MainDashboard.tsx
  - Set ready: true on all 5 mis-flagged modules
  - Remove "In Development" sub-heading

src/components/admin/AdminDashboard.tsx
  - Remove System Health card
  + Add card showing pending join requests + open feedback count

supabase/functions/admin-actions/index.ts
  - Drop systemHealth from platform_stats response
  + Add platform_health action returning real counts above

src/components/integrations/IntegrationsDashboard.tsx
  - Replace raw JSON form with category-grouped link hub
  - Keep delete/test buttons for legacy entries (read-only display)

src/components/social/SocialIntegrationsPanel.tsx
src/components/social/PostComposer.tsx
src/components/social/SocialMediaDashboard.tsx
  - Remove all Twitter UI

src/components/accessibility/SiteSettingsPanel.tsx
  - Remove page_structure toggle (labelled "coming soon")

src/components/ui/sidebar.tsx
  - Replace Math.random() skeleton width with index-derived value

src/hooks/useFlipbooks.ts
src/components/admin/FlipbookManager.tsx
src/components/mobile/UserFormDialog.tsx
src/components/social/PostComposer.tsx
  - Replace Math.random().toString(36) filenames with crypto.randomUUID()

src/components/chatbot/ChatbotAnalytics.tsx
  - Stop swallowing volunteer query errors silently
```

**Verification after deploy:**

1. Sign in as a non-admin Bizooma member → confirm Chatbots, Social, CRM, Campaigns, GBP, Analytics, Mobile App tiles all open without the upgrade wall.
2. Check `/admin` → no static "System Health 100%"; new card shows real counts.
3. `/dashboard` shows no "In Development" section; every tile has the green ready dot.
4. `/dashboard/integrations` shows the link hub, no raw JSON form.
5. `/dashboard/social` has no Twitter option in composer, integrations, or filters.

Approve and I'll implement all of the above in one pass.
