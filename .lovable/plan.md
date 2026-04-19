
User wants real tier enforcement: tier→product bundle mapping (auto-applied on subscription) + quantity caps enforced both client and server side.

## Scope

**Tier → Product Bundles**
- Free: chatbots, qr_codes
- Starter: + social_media, seo_audits, analytics
- Professional: + crm, tasks, google_business, campaigns
- Enterprise: all 10 products + mobile_app

**Quantity Caps** (centralized in `src/lib/aiTierLimits.ts` alongside message caps)
| Resource | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Chatbots | 1 | 3 | 10 | unlimited |
| QR codes | 5 | 25 | 100 | unlimited |
| Social accounts (integrations) | 1 | 3 | 10 | unlimited |

## Implementation Plan

**1. Schema migration**
- Add `subscription_tier text default 'free'` to `organizations` (if not present — confirm during build).
- No new tables. `purchased_products` already exists and is the access source of truth.

**2. Extend `src/lib/aiTierLimits.ts`**
Add `TIER_PRODUCT_BUNDLES: Record<Tier, ProductId[]>` and `TIER_QUANTITY_LIMITS: Record<Tier, { chatbots, qrCodes, socialAccounts }>`. Export helper `getLimitsForTier(tier)`.

**3. Auto-apply bundle on subscription change**
- Update `check-subscription` edge function: after determining tier, also update `organizations.subscription_tier` AND `purchased_products` (overwrite with bundle for that tier) for the org owned by that user. Look up org via owner email → memberships where role='owner'.
- This makes the existing `useProductAccess` hook automatically reflect tier changes — no other client changes needed for product gating.

**4. Server-side quantity enforcement (hard ceiling)**
Three new RPC functions (SECURITY DEFINER) called by edge functions / before client inserts:
- `check_chatbot_quota(_org_id)` → boolean
- `check_qr_quota(_org_id)` → boolean  
- `check_integration_quota(_org_id)` → boolean (only counts social_media providers)

Wire into:
- `generate-qr` edge function — return 403 with `quota_exceeded` if false
- New thin edge function `create-chatbot` OR add a DB trigger `BEFORE INSERT` on `chatbots` that raises exception if quota exceeded (simpler, covers all paths). Same trigger pattern for `qr_codes` and `integrations`.

Going with **DB triggers** — most reliable, single source of truth, can't be bypassed from client. Trigger reads org's `subscription_tier`, looks up cap, counts existing rows, raises `insufficient_privilege` with friendly message if over.

**5. Client-side UX (preempt the error)**
- New hook `useTierLimits(organizationId)` returns `{ tier, limits, counts: { chatbots, qrCodes, socialAccounts }, canCreate: { chatbot, qrCode, socialAccount } }`.
- In `ChatbotDashboard`, `QrCodeDashboard`, `SocialIntegrationsPanel`: disable "Create" buttons when at cap, show tooltip "Upgrade to add more" linking to `/pricing`.
- Catch DB trigger errors in `useChatbots.createChatbot`, `useQrCodes.createQrCode`, integration save → show toast "You've reached your [tier] plan limit. Upgrade for more."

**6. Pricing page**
Update copy on `/pricing` to reflect actual enforced limits per tier (chatbots/qr/social counts now real).

## Files touched
- Migration: add `subscription_tier` col + 3 quota triggers + 1 helper function
- `src/lib/aiTierLimits.ts` — add bundle + quantity tables
- `supabase/functions/check-subscription/index.ts` — sync tier + bundle to org
- `src/hooks/useTierLimits.ts` — new
- `src/hooks/useChatbots.ts`, `useQrCodes.ts`, `useIntegrations.ts` — error handling
- `ChatbotDashboard.tsx`, `QrCodeDashboard.tsx`, `SocialIntegrationsPanel.tsx` — disabled-button UX
- `src/pages/Pricing.tsx` — accurate limit copy

## Notes / risks
- Bundle overwrite on subscription sync means platform-admin manual `purchased_products` overrides will be reset next time `check-subscription` runs. Acceptable — admins should adjust tier instead. Will add a comment noting this.
- "Social accounts" cap counts `integrations` rows where provider is a social platform (facebook/instagram/linkedin/twitter). Mailchimp/Stripe don't count.
- Enterprise = no cap (NULL or large number; trigger skips check).
