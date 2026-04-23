

## Problem
The accessibility widget on causeio.com is not picking up the new "bottom left" position (and likely not rendering properly at all) because:

1. The loader script builds the config URL from its own origin: `<script origin>/functions/v1/accessibility-widget-config`. Since the script is served from `https://causeio.com`, it tries to fetch `https://causeio.com/functions/v1/accessibility-widget-config?...` — which doesn't exist (causeio.com returns the SPA index.html instead). The config fetch silently fails, so position and feature toggles never load.
2. Even when the widget does render (via the embedded `position` fallback), there's no way for it to read your saved DB position because the config call never reaches Supabase.

## Fix

### 1. Point the config fetch at the Supabase Functions URL (not the script's origin)
In `public/accessibility.js`, replace the origin-derived URL with the hard-coded Supabase Functions endpoint for this project:

```
https://<project-ref>.supabase.co/functions/v1/accessibility-widget-config?site=...
```

We'll read the project ref from `src/integrations/supabase/client.ts` and bake the full URL into the loader. This matches how `public/embed.js` already calls Supabase directly.

### 2. Verify the edge function allows anonymous GET
The function currently uses `corsHeaders` with `Access-Control-Allow-Origin: *` and uses the service role internally — good. But Supabase Edge Functions require either the anon key in the `Authorization` header OR the function to be configured as `verify_jwt = false`. We'll add the function to `supabase/config.toml` with `verify_jwt = false` so the public widget can call it without an API key.

### 3. Redeploy `accessibility.js` to causeio.com
After updating `public/accessibility.js` in this project, the file at `https://causeio.com/accessibility.js` must be updated. Since causeio.com is a separate deployment, we need to confirm: is causeio.com served from this same Lovable project (so a republish updates it), or is it a separate site where the file must be re-uploaded? I'll flag this in the implementation step.

## Files to change
- `public/accessibility.js` — hard-code Supabase Functions URL for `configUrl`; keep the `data-position` override as a manual escape hatch.
- `supabase/config.toml` — add `[functions.accessibility-widget-config]` with `verify_jwt = false`.

## Verification after deploy
- `curl https://<project-ref>.supabase.co/functions/v1/accessibility-widget-config?site=62c0d09c4829bcf645df6fe0` should return JSON with `position: "left"`.
- Reload causeio.com — launcher should appear on the bottom-left.

