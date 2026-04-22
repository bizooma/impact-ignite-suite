

## Goal
Create a new public marketing page at `/wcag-compliance` that explains how Causeio's accessibility/compliance widget helps protect nonprofit websites from ADA lawsuits, with a clear legal disclaimer.

## What Will Be Built

**1. New page** — `src/pages/WcagCompliance.tsx`

Follows the same structural pattern as `GoogleAdGrants.tsx` (sticky nav, hero, content cards, CTA, footer):

- **`SEOHead`** — title: "WCAG Compliance & ADA Lawsuit Protection for Nonprofits", description, canonical `/wcag-compliance`, keywords ("WCAG compliance", "ADA website lawsuit", "nonprofit accessibility")
- **Sticky top nav** — Causeio logo + "Back to Home" button (matches blog/marketing pages)
- **Hero section** — Headline "Protect Your Nonprofit from ADA Website Lawsuits", subhead about the rising trend of accessibility-related lawsuits, primary CTA "Get Started Free" → `/auth`, secondary "View Pricing" → `/pricing`
- **The Problem section** — Stats/context: ADA Title III lawsuits are increasing, nonprofits are not exempt, average settlement costs, screen-reader users underserved
- **What is WCAG?** — Brief explainer of WCAG 2.1/2.2 AA standards (perceivable, operable, understandable, robust)
- **Our Compliance Widget** — Feature grid (using `Card` + Lucide icons) describing what the embedded accessibility widget provides:
  - Screen reader optimization
  - Keyboard navigation enhancements
  - Color contrast & font size adjustments
  - Content scaling, dyslexia-friendly fonts
  - Cursor & focus indicators
  - Multi-language accessibility menu
  - One-line embed install
- **How It Helps Reduce Legal Risk** — Bullet list: demonstrates good-faith compliance effort, surfaces an accessibility statement, provides users with assistive tools, logs accessibility settings
- **Setup steps** — 3-step "How to enable" (sign up → embed snippet → publish)
- **Prominent Legal Disclaimer** — `Alert` component (warning variant) clearly stating:
  > **Legal Disclaimer:** Causeio's accessibility widget is a tool designed to help improve website accessibility and support WCAG compliance efforts. It does **not** guarantee full WCAG, ADA, Section 508, or any other legal compliance, and **Causeio is not liable** for any lawsuits, claims, damages, settlements, or legal fees that may arise from accessibility-related disputes. Website owners are solely responsible for the accessibility of their sites and should consult qualified legal counsel and certified accessibility auditors to assess compliance.
- **Final CTA section** — "Add the widget to your site today" → `/auth`
- **Footer** — Matches site (© 2026 Causeio)

**2. Route registration** — `src/App.tsx`
Add: `<Route path="/wcag-compliance" element={<WcagCompliance />} />` alongside the other public marketing routes (near `/google-ad-grants`).

**3. Sitemap** — `public/sitemap.xml`
Add `<url>` entry for `/wcag-compliance`.

## Out of Scope
- No changes to the actual Webability widget already loaded in `index.html`.
- No new database tables, edge functions, or product features.
- No navigation menu link added to the authenticated dashboard sidebar (this is a public marketing page; can be added later if requested).

## Technical Notes
- Reuses existing UI primitives: `SEOHead`, `Card`, `Badge`, `Alert`/`AlertDescription`, `Button`, Lucide icons (`Shield`, `Accessibility`, `AlertTriangle`, `CheckCircle`, `Eye`, `Keyboard`, `Type`, etc.).
- No new dependencies.
- Styling consistent with the warm, mission-driven landing aesthetic (per project memory).
- Disclaimer rendered using the existing `Alert` component with destructive/warning styling so it's visually distinct and unmissable.

