import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import QRCode from 'https://esm.sh/qrcode@1.5.4';

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

    console.log('Generating QR code:', { name, destinationUrl, type, organizationId, shape: brandConfig.shape });

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

    // Create tracking URL if dynamic
    let trackingUrl = finalUrl;
    if (type === 'dynamic') {
      trackingUrl = `${supabaseUrl}/functions/v1/qr-redirect/${qrCode.id}`;
      const { error: updateErr } = await supabase
        .from('qr_codes')
        .update({ short_url: trackingUrl })
        .eq('id', qrCode.id);
      if (updateErr) {
        console.error('Failed to persist short_url for QR code', updateErr);
      }
    }

    // Generate shaped QR code
    const qrCodeImage = await generateShapedQRCode(trackingUrl, brandConfig);

    return new Response(JSON.stringify({
      qrCode: {
        ...qrCode,
        short_url: trackingUrl
      },
      qrCodeSvg: qrCodeImage
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

async function generateShapedQRCode(data: string, brandConfig: any) {
  const shape = brandConfig.shape || 'square';
  const color = brandConfig.primaryColor || '#000000';
  const bgColor = brandConfig.backgroundColor || '#FFFFFF';
  
  // Configure QR code options based on shape
  const qrOptions: any = {
    errorCorrectionLevel: 'H',
    type: 'svg',
    width: 1024,
    margin: 2,
    color: {
      dark: color,
      light: bgColor
    }
  };

  // Generate base QR code as SVG string
  const qrSvg: string = await new Promise((resolve, reject) => {
    QRCode.toString(data, qrOptions, (err: Error | null | undefined, svg: string) => {
      if (err) reject(err);
      else resolve(svg);
    });
  });
  
  // Apply shape transformations to the SVG
  const shapedSvg = applyShapeToQR(qrSvg, shape, color, bgColor);
  
  return shapedSvg;
}

function applyShapeToQR(svgString: string, shape: string, color: string, bgColor: string): string {
  // Parse SVG and apply shape transformations
  let modifiedSvg = svgString;
  
  // Replace rect elements with shaped elements based on the selected shape
  switch (shape) {
    case 'circle':
      modifiedSvg = modifiedSvg.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*)\/>/g,
        (match, before, width, middle, height, after) => {
          const w = parseFloat(width);
          const h = parseFloat(height);
          const r = Math.min(w, h) / 2;
          return `<circle${before}r="${r}"${middle}cx="${r}"${after}cy="${r}"/>`;
        }
      );
      break;
      
    case 'rounded':
      modifiedSvg = modifiedSvg.replace(
        /<rect([^>]*)\/>/g,
        (match) => match.replace('rect', 'rect rx="20%" ry="20%"')
      );
      break;
      
    case 'dots':
      modifiedSvg = modifiedSvg.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*)\/>/g,
        (match, before, width, middle, height, after) => {
          const w = parseFloat(width);
          const h = parseFloat(height);
          const r = Math.min(w, h) / 2;
          return `<circle${before}r="${r * 0.9}"${middle}cx="${w/2}"${after}cy="${h/2}"/>`;
        }
      );
      break;
      
    case 'heart':
      // Add heart-shaped frame around QR
      modifiedSvg = addHeartFrame(modifiedSvg, color);
      break;
      
    case 'star':
      // Add star-shaped frame around QR
      modifiedSvg = addStarFrame(modifiedSvg, color);
      break;
      
    case 'hexagon':
      modifiedSvg = modifiedSvg.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*)\/>/g,
        (match, before, width, middle, height, after) => {
          const w = parseFloat(width);
          const h = parseFloat(height);
          const points = `${w*0.25},0 ${w*0.75},0 ${w},${h*0.5} ${w*0.75},${h} ${w*0.25},${h} 0,${h*0.5}`;
          return `<polygon${before}points="${points}"${middle}${after}/>`;
        }
      );
      break;
      
    case 'triangle':
      modifiedSvg = modifiedSvg.replace(
        /<rect([^>]*?)width="([^"]*)"([^>]*?)height="([^"]*)"([^>]*)\/>/g,
        (match, before, width, middle, height, after) => {
          const w = parseFloat(width);
          const h = parseFloat(height);
          const points = `${w*0.5},0 ${w},${h} 0,${h}`;
          return `<polygon${before}points="${points}"${middle}${after}/>`;
        }
      );
      break;
      
    case 'cloud':
      modifiedSvg = addCloudFrame(modifiedSvg, color);
      break;
      
    case 'sparkle':
      modifiedSvg = addSparkleFrame(modifiedSvg, color);
      break;
      
    default:
      // Square - no transformation needed
      break;
  }
  
  return modifiedSvg;
}

function addHeartFrame(svgString: string, color: string): string {
  // Extract viewBox and content
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024';
  const [, , width, height] = viewBox.split(' ').map(Number);
  
  const heartPath = `M${width/2},${height*0.9} 
    C${width/2},${height*0.9} ${width*0.1},${height*0.5} ${width*0.1},${height*0.3} 
    C${width*0.1},${height*0.1} ${width*0.3},${0} ${width/2},${height*0.2} 
    C${width*0.7},${0} ${width*0.9},${height*0.1} ${width*0.9},${height*0.3} 
    C${width*0.9},${height*0.5} ${width/2},${height*0.9} ${width/2},${height*0.9} Z`;
  
  return svgString.replace(
    '</svg>',
    `<path d="${heartPath}" fill="none" stroke="${color}" stroke-width="20" opacity="0.3"/></svg>`
  );
}

function addStarFrame(svgString: string, color: string): string {
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024';
  const [, , width, height] = viewBox.split(' ').map(Number);
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) * 0.48;
  const innerRadius = outerRadius * 0.4;
  
  let points = '';
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points += `${x},${y} `;
  }
  
  return svgString.replace(
    '</svg>',
    `<polygon points="${points.trim()}" fill="none" stroke="${color}" stroke-width="20" opacity="0.3"/></svg>`
  );
}

function addCloudFrame(svgString: string, color: string): string {
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024';
  const [, , width, height] = viewBox.split(' ').map(Number);
  
  const cloudPath = `M${width*0.2},${height*0.7} 
    Q${width*0.1},${height*0.7} ${width*0.1},${height*0.5} 
    Q${width*0.1},${height*0.3} ${width*0.3},${height*0.25} 
    Q${width*0.3},${height*0.15} ${width*0.45},${height*0.15} 
    Q${width*0.5},${height*0.05} ${width*0.6},${height*0.15} 
    Q${width*0.75},${height*0.15} ${width*0.8},${height*0.3} 
    Q${width*0.9},${height*0.35} ${width*0.9},${height*0.5} 
    Q${width*0.9},${height*0.65} ${width*0.8},${height*0.7} Z`;
  
  return svgString.replace(
    '</svg>',
    `<path d="${cloudPath}" fill="none" stroke="${color}" stroke-width="20" opacity="0.3"/></svg>`
  );
}

function addSparkleFrame(svgString: string, color: string): string {
  const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 1024 1024';
  const [, , width, height] = viewBox.split(' ').map(Number);
  
  // Add sparkle decorations around the QR code
  const sparkles = [
    { x: width * 0.1, y: height * 0.1, size: 30 },
    { x: width * 0.9, y: height * 0.1, size: 25 },
    { x: width * 0.1, y: height * 0.9, size: 25 },
    { x: width * 0.9, y: height * 0.9, size: 30 },
    { x: width * 0.5, y: height * 0.05, size: 20 },
  ];
  
  let sparklesSvg = '';
  sparkles.forEach(({ x, y, size }) => {
    sparklesSvg += `<path d="M${x},${y-size} L${x},${y+size} M${x-size},${y} L${x+size},${y} M${x-size*0.7},${y-size*0.7} L${x+size*0.7},${y+size*0.7} M${x-size*0.7},${y+size*0.7} L${x+size*0.7},${y-size*0.7}" stroke="${color}" stroke-width="4" opacity="0.4"/>`;
  });
  
  return svgString.replace('</svg>', `${sparklesSvg}</svg>`);
}
