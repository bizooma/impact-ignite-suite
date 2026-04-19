
User wants 4 changes on the post-beta-signup experience:

1. **Red banner** — Make the "Beta Lifetime Pricing — Locked In Forever" banner on `/dashboard/pricing-beta` use a red background (currently primary teal gradient) so it stands out.

2. **Free tier messaging** — Add copy on `PricingBeta.tsx` letting users know they can stay on the free tier and don't have to subscribe. Add a "Continue with Free Plan" or "Skip for now" link/button that takes them to `/dashboard`.

3. **Sidebar product locks** — All sidebar products show locks except Campaigns and Mobile Content. Need to check `useProductAccess` / `AppSidebar` — likely the new beta org has no `purchased_products` set, so everything is locked. Free tier should grant baseline access matching the standard free tier (per `TIER_PRODUCT_BUNDLES.free` in `aiTierLimits.ts`). Need to verify what `purchased_products` a beta org gets at provision time and ensure it matches the free tier bundle until they subscribe.

4. **Admin sidebar group** — User wants an "Admin" category in the sidebar (for org admins/owners, not platform admins) with sub-items for **Integrations** and **Team Members**. Currently `AppSidebar` has these scattered: `/dashboard/integrations` and `/dashboard/members` exist as routes but are mixed into other groups (or only shown via platform-admin section). Need to add a dedicated "Admin" `SidebarGroup` visible to org admins/owners that contains these two links.

### Plan

**File: `src/pages/PricingBeta.tsx`**
- Change banner classes from `border-primary/30 bg-gradient-to-r from-primary/10 ...` to a red palette: `border-red-500/40 bg-gradient-to-r from-red-500/15 via-red-500/10 to-red-500/15`, icon bg `bg-red-500/20`, icon color `text-red-600`, headline kept bold.
- Below the tier grid, add a centered note: "Not ready to subscribe? You can keep using Causeio on the **Free** plan — your beta lifetime discount stays locked in whenever you're ready." with a secondary `Button variant="ghost"` linking to `/dashboard` ("Continue with Free Plan").

**File: `supabase/functions/provision-beta-org/index.ts`**
- When inserting the new org, set `subscription_tier: 'free'` and `purchased_products: TIER_PRODUCT_BUNDLES.free` equivalent array (`['chatbots','qr_codes','seo_audits','analytics']` — confirm by reading `aiTierLimits.ts`) so the free-tier products are unlocked immediately. This fixes the "everything locked" issue for new beta signups.
- Also backfill: small migration to update existing beta orgs that have empty `purchased_products` to the free bundle.

**File: `src/components/layout/AppSidebar.tsx`**
- Add a new `SidebarGroup` titled "Admin" rendered when `isOrgAdmin` is true (already computed in the component), containing:
  - Integrations → `/dashboard/integrations` (Plug icon)
  - Team Members → `/dashboard/members` (Users icon)
- Remove these items from wherever they currently live if duplicated (verify with a quick read).

### Technical notes
- Free tier product bundle source of truth: `src/lib/aiTierLimits.ts` `TIER_PRODUCT_BUNDLES.free`. Mirror that exact array in the edge function (edge functions can't import src). Add a comment to keep them in sync.
- The grace-period redirect logic in `PricingBeta.tsx` stays unchanged.
- No DB schema changes needed; just data updates.

### Out of scope / assumptions
- Assuming free tier should include the same products as the standard `free` tier defined in `aiTierLimits.ts`. If you want beta free users to have *more* unlocked (e.g. CRM, Campaigns) tell me which products and I'll widen the bundle.
- Keeping the existing teal/primary styling on the rest of the page; only the top banner becomes red.
