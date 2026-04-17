
Remove shape selection from the QR code feature entirely. Keep colors, logo, and tracking — only strip out shape UI and shape rendering logic. Default all QR codes to standard square rendering.

## Changes

1. **`src/components/qr/QrSettingsDialog.tsx`** — Remove `QrShapePicker` import and the shape field from the Design tab. Stop writing `shape` into `brand_config` on save.

2. **`src/components/qr/QrCodeGenerator.tsx`** — Remove `QrShapePicker` import and shape state/UI. Stop including `shape` in submitted `brandConfig`.

3. **`src/components/qr/QrCodeDashboard.tsx`** — 
   - `QrPreview`: replace `buildShapedSvg` with the standard `qrcode` library to render a plain square QR (data URL via `<img>`).
   - `handleDownload`: replace `renderShapedQrPng` with standard `qrcode.toDataURL` for square PNG export.
   - Remove the "shape" badge overlay and the "Shape" row in each card.
   - Drop `renderShapedQrPng` / `buildShapedSvg` imports.

4. **`src/lib/qrShapeRenderer.ts`** — Delete the file (no longer referenced).

5. **`src/components/qr/QrShapePicker.tsx`** — Delete the file (no longer referenced).

6. **`supabase/functions/generate-qr/index.ts`** — Leave server-side shape logic in place but it will simply never receive a `shape` value (defaults to square). No change needed.

## Outcome

QR codes render as standard scannable squares everywhere (preview, download, generator). Shape UI is gone from both the create and edit dialogs. Existing `brand_config.shape` values in the DB are harmlessly ignored.
