import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      destinationUrl, 
      type = 'dynamic',
      organizationId,
      brandConfig = {},
      utmParams = {}
    } = await req.json();

    console.log('Generating QR code:', { name, destinationUrl, type, organizationId });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build final URL with UTM parameters
    let finalUrl = destinationUrl;
    if (Object.keys(utmParams).length > 0) {
      const urlObj = new URL(destinationUrl);
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          urlObj.searchParams.set(key, value);
        }
      });
      finalUrl = urlObj.toString();
    }

    // Create QR code record in database
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .insert([{
        name,
        destination_url: finalUrl,
        type,
        organization_id: organizationId,
        brand_config: brandConfig,
        utm_params: utmParams,
        is_active: true
      }])
      .select()
      .single();

    if (qrError) {
      console.error('Error creating QR code record:', qrError);
      throw new Error('Failed to create QR code record');
    }

    // Generate QR code using a simple library
    // For now, we'll return the data needed to generate the QR code on the frontend
    // In a production environment, you might want to use a QR generation service
    
    // Create tracking URL if dynamic
    let trackingUrl = finalUrl;
    if (type === 'dynamic') {
      // Create a tracking URL that redirects through our system
      trackingUrl = `${supabaseUrl.replace('supabase.co', 'functions.supabase.co')}/functions/v1/qr-redirect/${qrCode.id}`;
    }

    // Generate QR code SVG (simple implementation)
    const qrData = await generateQRCodeSVG(trackingUrl, brandConfig);

    return new Response(JSON.stringify({
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        destinationUrl: finalUrl,
        trackingUrl,
        type: qrCode.type,
        isActive: qrCode.is_active,
        createdAt: qrCode.created_at
      },
      qrCodeSvg: qrData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-qr:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate QR code' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Simple QR code SVG generation function
async function generateQRCodeSVG(data: string, brandConfig: any) {
  // This is a simplified QR code generator
  // In production, you'd want to use a proper QR code library
  const size = 300;
  const foregroundColor = brandConfig.foregroundColor || '#000000';
  const backgroundColor = brandConfig.backgroundColor || '#FFFFFF';
  
  // Generate a simple placeholder QR code pattern
  // In reality, you'd implement proper QR code generation or use a service
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${backgroundColor}"/>
      <!-- Simplified QR pattern - in production use proper QR generation -->
      <rect x="20" y="20" width="60" height="60" fill="${foregroundColor}"/>
      <rect x="220" y="20" width="60" height="60" fill="${foregroundColor}"/>
      <rect x="20" y="220" width="60" height="60" fill="${foregroundColor}"/>
      <!-- Add more QR pattern elements here -->
      <text x="${size/2}" y="${size-10}" text-anchor="middle" font-size="12" fill="${foregroundColor}">
        QR Code for: ${data.length > 30 ? data.substring(0, 30) + '...' : data}
      </text>
    </svg>
  `;
  
  return svg;
}