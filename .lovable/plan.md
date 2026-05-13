## Issue

A brand-new account (Free tier) sees the "AI Usage — This Month" card showing **0 / 0 messages, 100%, "Monthly cap reached. Chatbot is blocked"**. This is misleading because:

1. The Free tier's `monthlyMessageCap` is hard-coded to `0` in `src/lib/aiTierLimits.ts`, so `usagePct(0, 0)` returns `1` → the UI shows the user as "blocked" even though they haven't sent a single message.
2. The Free tier bundle doesn't even include `chatbots` (see `TIER_PRODUCT_BUNDLES.free`), so the cap warning isn't actionable — there's no chatbot to block.

## Fix

Two small changes in `src/components/admin/AIUsageDashboard.tsx` (no business-logic change to caps themselves):

1. **Hide the cap progress bar + "Monthly cap reached" alert when `cap === 0`.** Instead, render a friendly empty-state row inside the same card explaining that AI chatbot messaging isn't included on the Free tier and linking to `/pricing` to upgrade. The header, tier badge, and bottom 3-stat strip (Platform / BYO / Embedding) still render so admins keep visibility into metered usage.
2. **Suppress the `critical` / `warn` / `blocked` alerts entirely when `cap === 0`** — these only make sense for paid tiers with a real cap.

No DB changes, no edge-function changes, no changes to `aiTierLimits.ts` (caps stay as-is so admins can later decide to grant Free a trial allowance just by editing one number).

## Out of scope

- Granting Free tier a trial message allowance (separate product decision).
- Hiding the entire AI Usage card from Free orgs (admins may still want to see embedding/BYO counts).
- Touching the auth/org-provisioning workflow from the previous turn.