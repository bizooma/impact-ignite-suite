

## Goal
Embed the live chat widget **only** on `/dashboard/support` — not globally across the site.

## Approach
Inject the widget's `<script>` tag dynamically when the Support page mounts, and remove it (plus any DOM it created) when the user navigates away. This keeps `index.html` clean and scopes the widget to a single route.

## Changes

### 1. `src/pages/Support.tsx` — mount widget per-route
Add a `useEffect` that:
- Creates a `<script>` element pointing at the widget's `embed.js` URL with the appropriate `data-chatbot-id`, `data-primary-color`, and `data-accent-color` attributes (same values currently in `index.html`).
- Appends it to `document.body` on mount.
- On unmount: removes the injected `<script>`, removes the widget's root container (`#causeio-widget-root` — created by `widget-entry.tsx`), removes the injected `<link>` for `widget.css`, and clears the `window.__CAUSEIO_WIDGET_LOADED__` / `window.__CAUSEIO_WIDGET_LOADING__` flags + `window.CauseioWidget` so a fresh init works on re-entry.

Replace the current "Start a Chat" card's button behavior with a small note like "Chat widget available in the bottom-right corner" (or keep the button as a no-op visual cue), since the launcher itself appears via the embedded widget.

### 2. `index.html` — remove the global embed
Delete the `<script src="/embed.js?v=20251020" data-chatbot-id="..." ...>` tag from the body so the widget no longer loads on every page (landing, auth, dashboards, etc.). The Webability accessibility widget stays.

## Notes
- The exact chatbot ID + colors will be copied verbatim from the current `index.html` block so behavior on the Support page is identical to today.
- Cleanup is important — without it, navigating away and back would either leave a stale launcher visible on other routes or fail to re-initialize.

