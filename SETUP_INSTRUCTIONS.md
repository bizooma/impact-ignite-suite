# Chatbot Widget Setup - Quick Start

## 🚀 Deploy Your Widget

The widget files are pre-built and ready to upload.

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

When you make changes to the chatbot components, ask Lovable to rebuild the widget files, then:

1. Re-upload the 3 files to Supabase Storage
2. Changes are live immediately (no caching)

## 📚 Full Documentation

See `WIDGET_DEPLOYMENT.md` for detailed technical documentation.
