## Goal

Make beta/early-adopter customers feel special by upgrading the bottom-of-dashboard "Wishlist & Feedback" area into a VIP-themed section that lists their 6 founding-member benefits alongside the feedback form. Non-beta orgs continue to see the existing standard `FeedbackCard` unchanged.

## How to detect a beta user

The `organizations` table already has an `is_beta_org` boolean (already exposed via `useOrganization` and queried in `MainDashboard`). We'll fetch this flag in `MainDashboard` (extend the existing `organization` query to also select `is_beta_org`) and conditionally render the new component.

## New component: `BetaVipSection`

File: `src/components/dashboard/BetaVipSection.tsx`

Layout (single card, warm/premium feel):

```text
┌─────────────────────────────────────────────────────────────┐
│  ✦ FOUNDING MEMBER  (small gold pill badge)                 │
│  You're a VIP                                               │
│  Thank you for being one of our earliest believers. Here's │
│  what your founder status unlocks — for life.              │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ 💎      │ │ ⚡      │ │ 🧠      │   (3 cols desktop,    │
│  │ Founder │ │Priority │ │ Direct  │    2 cols tablet,     │
│  │ Pricing │ │ Access  │ │Influence│    1 col mobile)      │
│  └─────────┘ └─────────┘ └─────────┘                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ 🤝      │ │ 📈      │ │ ✦       │                       │
│  │ Private │ │ Unfair  │ │Members- │                       │
│  │ Access  │ │Advantage│ │  Only   │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
│  ─────────────────────────────────────────────              │
│  Help shape what's next                                     │
│  Your feedback goes straight to the founders. We read       │
│  every submission and prioritize what beta members ask for. │
│                                                             │
│  [ Type ▼ ] [ Title ............................. ]        │
│  [ Details textarea ............................. ]        │
│                                       [ Submit Feedback ]   │
└─────────────────────────────────────────────────────────────┘
```

The 6 benefit tiles each show: emoji/icon, title, one-line description. Visual treatment uses a warm gradient border and subtle gold accent so it reads as premium without clashing with the rest of the dashboard.

The 6 benefits (verbatim from request):

1. 💎 Founder-Level Pricing — Lock in the lowest pricing we'll ever offer.
2. ⚡ Priority Access — Be first to new features and releases.
3. 🧠 Direct Influence — Your feedback shapes the roadmap.
4. 🤝 Private Access — Invitations to beta programs and private demos.
5. 📈 Unfair Advantage — Use tools your competitors don't even know about yet.
6. ✦ Members-Only Network — Connect with a curated circle of early adopters.

## Reusing the feedback form

To avoid duplicating logic, refactor `FeedbackCard.tsx` minimally:

- Extract its inner form into a small internal `FeedbackForm` (still exported from the same file) that takes `organizationId` and renders just the fields + submit button (no Card wrapper, no header).
- `FeedbackCard` keeps its current Card+header behavior and just renders `<FeedbackForm>`.
- `BetaVipSection` imports `FeedbackForm` and embeds it under the benefits grid inside its own VIP-styled Card, with a "Help shape what's next" header instead of the generic one.

This keeps the existing submit logic, validation, and toast intact for both audiences.

## Wiring in `MainDashboard`

- Extend the existing `organization` query to also select `is_beta_org`.
- Replace the single `<FeedbackCard organizationId={...} />` at the bottom with:
  - `isBeta ? <BetaVipSection organizationId={...} /> : <FeedbackCard organizationId={...} />`

## Files

- New: `src/components/dashboard/BetaVipSection.tsx`
- Edited: `src/components/dashboard/FeedbackCard.tsx` (extract reusable `FeedbackForm`)
- Edited: `src/components/dashboard/MainDashboard.tsx` (fetch `is_beta_org`, conditional render)

## Out of scope

- No DB schema changes — `is_beta_org` already exists.
- No changes to the signup flow or to how orgs are flagged as beta.
- Benefits are static copy for now; no admin editor.
