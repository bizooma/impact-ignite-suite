#!/bin/bash

# Causeio Widget Deployment Script
set -e

echo "=================================="
echo "📦 CAUSEIO WIDGET SETUP"
echo "=================================="
echo ""

# Check if build script exists in package.json
if ! grep -q '"build:widget"' package.json; then
  echo "⚠️  REQUIRED: Add this to package.json scripts section:"
  echo ""
  echo '  "build:widget": "vite build --config vite.widget.config.ts"'
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ Build script found in package.json"
echo ""
echo "🚀 Building widget..."
npm run build:widget

echo ""
echo "✅ Widget built successfully!"
echo ""
echo "📦 Files created:"
echo "  ✓ dist-widget/widget.umd.js"
echo "  ✓ dist-widget/widget.css"
echo "  ✓ public/embed.js"
echo ""
echo "=================================="
echo "📤 UPLOAD TO SUPABASE STORAGE"
echo "=================================="
echo ""
echo "1. Open: https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/storage/buckets/widget-hosting"
echo ""
echo "2. Upload these 3 files (drag & drop):"
echo "   • public/embed.js"
echo "   • dist-widget/widget.umd.js"
echo "   • dist-widget/widget.css"
echo ""
echo "=================================="
echo "✅ READY TO USE"
echo "=================================="
echo ""
echo "Your embed code:"
echo '<script src="https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js" data-chatbot-id="YOUR_CHATBOT_ID"></script>'
echo ""
echo "💡 Get your chatbot ID from the dashboard"
echo "🎯 Click 'Activate Chatbot' to go live!"
