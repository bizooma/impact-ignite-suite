
The user is stating a business rule, not requesting changes. Let me check current state to see if anything needs alignment.

Looking at context:
- `memberships` table has roles including `owner` and `admin`
- Sign-up flow creates org via `DashboardLayout` → `createOrganization` (presumably assigns owner)
- Stripe checkout uses `user.email` to look up customer
- No explicit billing-management gating tied to owner role visible

The rule has three implications:
1. The signing-up email = org owner (likely already true via createOrganization)
2. Owner can assign other admins (already supported via InviteMemberDialog with role selection)
3. Only the owner sees/manages billing (needs verification — Pricing/subscription pages may not gate by role)

Saving this as a Core memory rule so it's applied to every future billing/admin decision. No code changes needed right now unless the user wants enforcement audited.

## Plan

**Save business rule to memory** (Core, applies platform-wide):
- Update `mem://index.md` Core section with: "Org billing rule: the email that pays/signs up = organization owner (super admin). Owner manages billing exclusively. Owner can invite additional admins, but admins cannot manage billing/subscription."

**No code changes** in this turn. The rule will govern future work:
- Pricing/checkout flows must use owner's email as Stripe customer
- Billing/subscription UI (manage subscription, payment methods, plan changes) must be gated to `owner` role only
- Admin role can manage org operations (members, integrations, content) but NOT billing
- Org creation already assigns the creator as owner — keep it that way

**Optional follow-up** (only if you want me to do it now):
- Audit `Pricing.tsx`, `PaymentSuccess.tsx`, `create-checkout` edge function, and the new Admin sidebar group to ensure billing-related items are owner-only (not admin-visible).
