## Goal

Weave the meaning of the tagline **"Where Purpose Meets Performance"** into the existing **Our Story** section on the landing page so it becomes a natural, canonical explanation visitors will see.

## Where

`src/pages/Landing.tsx`, lines ~334–346 — the "Our Story" / "Built by Bizooma Creative Agency" card.

## Change

Add a third paragraph (and a small visual emphasis) that ties the Bizooma origin story directly to the tagline, so the "why" of the platform is explicit on the page.

### Updated copy (proposed)

Keep the existing two paragraphs intact, then add:

> **Where Purpose Meets Performance.** That tagline isn't just words on our logo — it's the bridge between the two worlds we live in. **Purpose** is the mission driving every nonprofit we serve: the donors moved, the volunteers mobilized, the lives changed. **Performance** is the marketing horsepower we built for high-budget law firms — automation, AI, analytics, and reach. Causeio fuses them, so mission-driven teams never have to choose between doing good and doing it well.

Styled as a short, slightly emphasized block (e.g. a left-bordered callout using `border-l-4 border-primary pl-4 italic` or a subtle muted card) so it visually anchors as the takeaway of the section.

### Layout note

The "Offices: Jacksonville, FL & Amarillo, TX" line stays at the bottom. The new paragraph goes between the existing second paragraph and the offices line.

## Out of scope

- No changes to other sections, the hero, or the FAQ.
- No new images or icons — purely typographic emphasis using existing tokens.

## Files touched

- `src/pages/Landing.tsx` (single section edit)
