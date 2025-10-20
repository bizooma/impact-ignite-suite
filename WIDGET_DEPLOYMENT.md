# Causeio Chatbot Widget - Deployment Guide

This guide explains how to build and deploy the embeddable chatbot widget to Supabase Storage.

## Overview

The widget system consists of:
- **`embed.js`** - Loader script that users add to their websites
- **`widget.umd.js`** - Main widget bundle (React app compiled)
- **`widget.css`** - Widget styles

## Building the Widget

### 1. Build the widget bundle

```bash
npm run build:widget
# or
bun run build:widget
```

This command uses `vite.widget.config.ts` to create a standalone UMD bundle in the `dist-widget/` directory.

### 2. Verify the build

Check that these files exist in `dist-widget/`:
- `widget.umd.js` - The main JavaScript bundle
- `widget.css` - The stylesheet

## Deploying to Supabase Storage

### Option A: Manual Upload (One-time Setup)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/storage/buckets/widget-hosting

2. Upload these files to the `widget-hosting` bucket:
   - `public/embed.js` (from your project root)
   - `dist-widget/widget.umd.js` (after building)
   - `dist-widget/widget.css` (after building)

3. Verify the files are publicly accessible:
   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js
   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/widget.umd.js
   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/widget.css

### Option B: Automated Upload Script (Recommended)

Create a script to automate uploads:

```bash
# deploy-widget.sh
#!/bin/bash

# Build the widget
echo "Building widget..."
npm run build:widget

# Upload to Supabase using CLI
echo "Uploading to Supabase Storage..."
supabase storage cp public/embed.js supabase://widget-hosting/embed.js
supabase storage cp dist-widget/widget.umd.js supabase://widget-hosting/widget.umd.js
supabase storage cp dist-widget/widget.css supabase://widget-hosting/widget.css

echo "✅ Widget deployed successfully!"
```

## Testing the Widget

### 1. Test on your own website

Add this code to any HTML page:

```html
<script
  src="https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-primary-color="#0066CC"
  data-accent-color="#00AA44"
></script>
```

### 2. Test locally

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <h1>Widget Test Page</h1>
  
  <script
    src="https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js"
    data-chatbot-id="3c83a2ce-c387-47bd-8f86-b10154810d16"
    data-primary-color="#0066CC"
    data-accent-color="#00AA44"
  ></script>
</body>
</html>
```

Open it in your browser and verify:
- Widget launcher appears in the corner
- Clicking the launcher opens the chat
- Messages send and receive properly
- Colors are applied correctly

## Troubleshooting

### Widget doesn't load
1. Check browser console for errors
2. Verify files are publicly accessible in Supabase Storage
3. Ensure chatbot status is "active" in the database
4. Check CORS settings in browser dev tools

### Widget loads but doesn't work
1. Check edge function logs: https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/functions/chat-handler/logs
2. Verify OPENAI_API_KEY is set in Supabase secrets
3. Check chatbot has knowledge sources or FAQs configured

### Styling issues
1. Verify `widget.css` is loading (check Network tab)
2. Check for CSS conflicts with host website
3. Ensure Tailwind classes are compiled correctly

## Updating the Widget

When you make changes to the widget:

1. Update the code in `src/components/chatbot/`
2. Rebuild: `npm run build:widget`
3. Re-upload to Supabase Storage
4. No need to update embed code on websites (it auto-loads latest version)

## Security Notes

- The `widget-hosting` bucket is public (read-only)
- Only platform admins can upload new files
- Rate limiting is enabled on chat-handler (30 req/min per IP)
- Only "active" chatbots are served to external widgets

## Performance

- Widget bundle is ~200-300KB gzipped
- First load time: ~1-2 seconds
- Supabase CDN caches files globally
- Consider adding versioning for cache busting if needed

## Next Steps

1. Set up automated deployment in CI/CD
2. Add versioning to widget files (e.g., `widget.v1.0.0.umd.js`)
3. Monitor usage via chatbot_events table
4. Consider adding A/B testing for widget variations
