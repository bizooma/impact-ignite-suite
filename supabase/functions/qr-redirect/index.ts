import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const qrCodeId = url.pathname.split('/').pop();

    if (!qrCodeId) {
      return new Response('QR Code ID not provided', { status: 400 });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get QR code details
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', qrCodeId)
      .eq('is_active', true)
      .single();

    if (qrError || !qrCode) {
      console.error('QR code not found:', qrError);
      return new Response('QR Code not found', { status: 404 });
    }

    // Extract scan data from request
    const userAgent = req.headers.get('user-agent');
    const referrer = req.headers.get('referer');
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ipAddress = (forwardedFor?.split(',')[0]?.trim()) ||
                     req.headers.get('x-real-ip')?.trim() ||
                     '127.0.0.1';

    // Parse device info from user agent
    const deviceInfo = parseUserAgent(userAgent || '');

    // Record the scan
    const { error: scanError } = await supabase
      .from('qr_scans')
      .insert([{
        qr_code_id: qrCodeId,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer: referrer,
        device_info: deviceInfo,
        scanned_at: new Date().toISOString()
      }]);

    if (scanError) {
      console.error('Error recording scan:', scanError);
      // Continue with redirect even if scan recording fails
    }

    // Redirect to destination URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': qrCode.destination_url
      }
    });

  } catch (error) {
    console.error('Error in qr-redirect:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing - in production you'd use a proper library
  const deviceInfo: any = {
    userAgent: userAgent,
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown'
  };

  // Detect browser
  if (userAgent.includes('Chrome')) deviceInfo.browser = 'Chrome';
  else if (userAgent.includes('Firefox')) deviceInfo.browser = 'Firefox';
  else if (userAgent.includes('Safari')) deviceInfo.browser = 'Safari';
  else if (userAgent.includes('Edge')) deviceInfo.browser = 'Edge';

  // Detect OS
  if (userAgent.includes('Windows')) deviceInfo.os = 'Windows';
  else if (userAgent.includes('Mac')) deviceInfo.os = 'macOS';
  else if (userAgent.includes('Linux')) deviceInfo.os = 'Linux';
  else if (userAgent.includes('Android')) deviceInfo.os = 'Android';
  else if (userAgent.includes('iOS')) deviceInfo.os = 'iOS';

  // Detect device type
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    deviceInfo.device = 'Mobile';
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    deviceInfo.device = 'Tablet';
  } else {
    deviceInfo.device = 'Desktop';
  }

  return deviceInfo;
}