# Chatbot Widget Setup - Quick Start

## ⚠️ ONE-TIME MANUAL STEP REQUIRED

Add this line to your `package.json` in the `"scripts"` section:

```json
"build:widget": "vite build --config vite.widget.config.ts"
```

**Example:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:widget": "vite build --config vite.widget.config.ts",  ← ADD THIS
    "preview": "vite preview"
  }
}
```

## 🚀 Deploy Your Widget (2 Steps)

### Step 1: Build the Widget
```bash
npm run build:widget
```
Or use the helper script:
```bash
bash scripts/deploy-widget.sh
```

### Step 2: Upload to Supabase Storage

1. **Open Supabase Storage:**
   https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/storage/buckets/widget-hosting

2. **Upload these 3 files** (drag & drop):
   - `public/embed.js`
   - `dist-widget/widget.umd.js`
   - `dist-widget/widget.css`

## ✅ You're Done!

### Using Your Widget

Copy this embed code from your dashboard's chatbot preview:

```html
<script 
  src="https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js"
  data-chatbot-id="YOUR_CHATBOT_ID"
></script>
```

### Testing

Open `scripts/test-widget.html` in your browser to test the widget locally.

### Activating Your Chatbot

1. Go to Dashboard → Chatbots
2. Click "Activate Chatbot" button
3. Your widget is now live!

## 🔄 Updating Your Widget

When you make changes to the chatbot:

1. Run `npm run build:widget`
2. Re-upload the 3 files to Supabase Storage
3. Changes are live immediately (no caching)

## 📚 Full Documentation

See `WIDGET_DEPLOYMENT.md` for detailed technical documentation.
