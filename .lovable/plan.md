
Add a readiness status system to the Mission Dashboard cards.

## Changes

**`src/components/dashboard/MainDashboard.tsx`**

1. Add a `ready: boolean` field to each entry in `moduleCards`. Set `qr-codes` → `true`. All others → `false`.

2. Replace the existing "Ready to Use" section heading block with two stacked headings:
   - "Ready to Use" with green pulsing dot (existing style)
   - "In Development" with red dot (new)

3. In each card's `CardHeader`, replace the icon block (`<div className="w-12 h-12 bg-{color}/10 ..."><module.icon /></div>`) with a status dot:
   - Green pulsing dot (`bg-success`) if `module.ready`
   - Red dot (`bg-destructive`) if not
   - Use a small wrapper (e.g. `w-12 h-12` flex-center) so card layout stays identical
   - Drop the `module.icon` and `module.color` rendering on the card face (icons remain imported for the CTA section at the bottom)

4. Keep all 9 cards in a single grid (no split into two grids) — the two headings sit above the same grid, since the dots on each card already communicate status per-card. The headings act as a legend.

## Outcome
Each dashboard card shows a colored status dot in place of its icon: green = ready (QR Codes only for now), red = in development (everything else). A legend above the grid explains the two colors.
