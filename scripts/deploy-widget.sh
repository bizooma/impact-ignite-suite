#!/bin/bash

# Causeio Widget Deployment Script
# This script builds the widget and uploads it to Supabase Storage

set -e  # Exit on error

echo "🚀 Building Causeio Widget..."

# Build the widget
npm run build:widget

echo "✅ Widget built successfully!"
echo ""
echo "📦 Widget files created:"
echo "  - dist-widget/widget.umd.js"
echo "  - dist-widget/widget.css"
echo "  - public/embed.js"
echo ""
echo "📤 Next Steps:"
echo ""
echo "1. Go to Supabase Storage:"
echo "   https://supabase.com/dashboard/project/svuxuhrsrawdqqkepeye/storage/buckets/widget-hosting"
echo ""
echo "2. Upload these 3 files:"
echo "   - public/embed.js"
echo "   - dist-widget/widget.umd.js"
echo "   - dist-widget/widget.css"
echo ""
echo "3. Verify the files are accessible at:"
echo "   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js"
echo "   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/widget.umd.js"
echo "   - https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/widget.css"
echo ""
echo "4. Test your widget by adding this to any HTML page:"
echo '<script'
echo '  src="https://svuxuhrsrawdqqkepeye.supabase.co/storage/v1/object/public/widget-hosting/embed.js"'
echo '  data-chatbot-id="3c83a2ce-c387-47bd-8f86-b10154810d16"'
echo '  data-primary-color="#0066CC"'
echo '  data-accent-color="#00AA44"'
echo '></script>'
echo ""
echo "✨ After uploading, click 'Activate Chatbot' in your dashboard to go live!"
