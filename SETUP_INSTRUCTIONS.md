# Chatbot Widget Setup - Quick Start

## ✅ Automated Widget Build Setup

To enable automatic widget builds with your app deployment:

### One-Time Setup (Required)

Add this to your `package.json` scripts section:

```json
{
  "scripts": {
    "build": "vite build && node scripts/build-widget-post.js",
    "build:dev": "vite build --mode development && node scripts/build-widget-post.js"
  }
}
```

**Note:** You'll need to manually edit `package.json` to add these scripts. After this one-time setup, the widget will build automatically every time you deploy!

## 🚀 Deploy Your Widget

After your app deploys (with the widget build), upload the generated files:

### Upload to Supabase Storage

After your app is deployed, the widget files are automatically generated. You just need to upload them:

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

With automated builds enabled:

1. Deploy your app (widget builds automatically)
2. Re-upload the 3 files to Supabase Storage
3. Changes are live immediately (no caching)

### Manual Build (if needed)

You can also manually build the widget anytime:

```bash
npm run build:widget
node scripts/build-widget-post.js
```

## 📚 Full Documentation

See `WIDGET_DEPLOYMENT.md` for detailed technical documentation.
