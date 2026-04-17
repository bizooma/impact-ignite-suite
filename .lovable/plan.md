
The user wants the QR code's overall silhouette to take the form of the selected shape (heart, star, circle, hexagon, etc.) — not a square QR with a shape outline overlay. The QR modules themselves should fill/conform to the chosen shape.

## Approach

Use SVG clipping: render the standard square QR module grid, then clip it to the silhouette of the chosen shape. The background also takes the shape (no surrounding square). For decorative shapes (heart, star, cloud), this means the QR "fills" the heart/star outline.

### Technical plan

Update `src/lib/qrShapeRenderer.ts`:

1. **Define silhouette paths** for each shape at the SVG viewBox scale (`total x total`):
   - `square` — full rect (current behavior)
   - `circle` / `dots` — circle inscribed in viewBox
   - `rounded` — rect with large border-radius
   - `hexagon`, `triangle` — polygon
   - `heart`, `star`, `cloud`, `sparkle` — path/polygon silhouette

2. **Restructure SVG output**:
   - Add `<defs><clipPath id="qrClip"><path d="<silhouette>"/></clipPath></defs>`
   - Background `<path d="<silhouette>" fill="${backgroundColor}"/>` (replaces square `<rect>`)
   - Wrap all module rects in `<g clip-path="url(#qrClip)">` so modules outside the silhouette are clipped away
   - Remove the old decorative overlay (no longer needed — silhouette IS the shape)

3. **Module rendering**: keep modules as squares (best scannability) since the clip handles the silhouette. Drop the per-module shape variants except keep `dots`/`rounded` as module styles when shape is `dots`/`rounded` (those shapes are about module style, not silhouette).
   - Clarification: `dots` and `rounded` will keep current "module style" behavior on a square canvas.
   - True silhouette shapes: `circle`, `heart`, `star`, `hexagon`, `triangle`, `cloud`, `sparkle`.

4. **Increase QR error correction & margin** for silhouette shapes so clipped modules at the edges don't break scannability. Use `errorCorrectionLevel: 'H'` (already set) and add extra padding inside the silhouette so the QR grid sits in the largest inscribed rect of the shape — guaranteeing no data modules are clipped, only the background extends to form the silhouette.

   Strategy: compute an inscribed rect for each silhouette (e.g., for heart, use ~70% centered; for circle, `size/√2`), scale modules to fit inside it, then draw the silhouette as background extending beyond the modules. This keeps the QR fully scannable AND gives the overall artwork the chosen shape.

5. **Update `QrPreview` and `handleDownload`** in `QrCodeDashboard.tsx` — no changes needed, they already pass `shape` through.

### Files to edit
- `src/lib/qrShapeRenderer.ts` — rewrite SVG construction with clipPath + inscribed-rect module placement + silhouette background

### Tradeoffs
- For irregular silhouettes (heart, star, cloud), the QR grid will be visibly smaller relative to the artwork, with the colored silhouette extending around it. This is the standard approach used by branded QR generators (it preserves scannability).
- Alternative (clipping the QR itself) would corrupt the code and make it unscannable — not recommended.
