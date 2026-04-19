

## Beta Signup → Auto-Account → Lifetime Discount Pricing

### What changes for the user

1. **Hero beta form** gets a password field. Submitting it now creates a real account, marks their org as "beta", and drops them on a special pricing page with deeply discounted prices locked in for life.
2. **New `/dashboard/pricing-beta`** route shows beta-only prices (e.g. Starter $59 / Pro $139 / Enterprise $219 — final numbers your call) with a "Beta lifetime pricing" badge. Non-beta orgs hitting that URL get bounced to `/pricing`.
3. **Checkout** displays the beta price in the UI and applies a Stripe coupon (`BETA_LIFETIME`, forever duration) so the discount is auditable in Stripe and survives any future price changes.

### Database changes (1 migration)

Add a beta flag to `organizations`:
- `is_beta_org boolean not null default false`
- `beta_signup_id uuid` (links back to `beta_signups.id`)

No new table needed — `beta_signups` already stores email/name/org.

### Stripe setup (3 new products + 1 coupon)

Create new lifetime-discounted **Beta** prices alongside existing ones (so regular checkout is untouched):
- Causeio Starter — Beta — $59/mo
- Causeio Professional — Beta — $139/mo
- Causeio Enterprise — Beta — $219/mo

Plus a `BETA_LIFETIME` coupon (0% additional off — the discount is baked into the price). The coupon's only job is to **tag** the subscription in Stripe so we can audit who got beta pricing. (If you'd rather have the coupon do the math, I can flip to using existing prices + a real % off — say so before approving.)

### Frontend changes

**`BetaSignupForm.tsx`**
- Add password field (min 6 chars) to the Zod schema and form.
- On submit:
  1. `supabase.auth.signUp(email, password, name)` with `emailRedirectTo: window.location.origin + '/dashboard/pricing-beta'`
  2. Insert into `beta_signups` (existing flow).
  3. Call new edge function `provision-beta-org` (below).
  4. Redirect to `/dashboard/pricing-beta`.

**New `src/pages/PricingBeta.tsx`**
- Reads current org via `useOrganization()`.
- If `!organization.is_beta_org` → `<Navigate to="/pricing" replace />`.
- Renders 3 tier cards with beta prices + "🎉 Beta Lifetime Pricing — locked in forever" banner.
- Subscribe button calls `create-checkout` with the beta priceId and `tierName`.

**`App.tsx`** — add the `/dashboard/pricing-beta` route inside `DashboardLayout`.

### Backend changes

**New edge function `provision-beta-org`** (verify_jwt = true)
- Runs after signup. Creates an org for the user (name = their org or "{name}'s Organization"), inserts membership as `owner`, sets `is_beta_org = true`, `beta_signup_id = ...`.
- Service-role client to bypass RLS.

**`create-checkout` (existing)** — small additions:
- Accept the new beta priceIds.
- When the priceId is a beta one, validate server-side that the caller's owner-org has `is_beta_org = true`. Reject otherwise (prevents URL tampering).
- Pass `discounts: [{ coupon: 'BETA_LIFETIME' }]` on the session for tagging.

**`check-subscription` (existing)** — extend `PRODUCT_TIERS` map to include the 3 new beta product IDs → same tier names. No other logic change needed.

### Flow diagram

```text
Hero form (email+password+name+org)
   │
   ├─► supabase.auth.signUp ──► email confirmation (existing setup)
   ├─► insert beta_signups (existing)
   ├─► invoke provision-beta-org ──► org created, is_beta_org=true, owner membership
   └─► redirect /dashboard/pricing-beta
                    │
                    ├─ is_beta_org? ─ yes ─► beta prices ─► create-checkout (validates) ─► Stripe (with BETA_LIFETIME coupon)
                    └─ no ─► /pricing
```

### Open items I'll default unless you say otherwise

- Beta tier prices: **$59 / $139 / $219** (≈60% off). Tell me if you want different numbers before I create the Stripe products.
- Email confirmation stays on; users land on `/dashboard/pricing-beta` after confirming. If you want **passwordless instant access** (no confirmation), I'll disable email confirm for this flow.
- Beta signup form will ask for org name as required (not optional) since we need it to create the org.

