import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMAGE_PROMPTS: Record<string, string> = {
  chatbot: "Professional customer service representative with headset working at modern desk with AI interface holographic displays, warm lighting, nonprofit office setting, photorealistic, 16:9 aspect ratio, ultra high resolution",
  qrcode: "Elegant QR code scanning with smartphone in modern nonprofit environment, close-up hand holding phone, sleek design, professional lighting, photorealistic, 16:9 aspect ratio, ultra high resolution",
  social: "Social media content creation workspace with multiple social platform icons floating, laptop showing social calendar, modern office, vibrant but professional, photorealistic, 16:9 aspect ratio, ultra high resolution",
  seo: "Professional analytics dashboard on large monitor showing graphs and metrics, modern workspace, data visualization, clean aesthetic, photorealistic, 16:9 aspect ratio, ultra high resolution",
  google: "Google Business Profile on tablet with 5-star reviews visible, local business storefront in background, professional lighting, photorealistic, 16:9 aspect ratio, ultra high resolution",
  crm: "Professional database management interface with contact cards, organized workspace, clean modern aesthetic, people icons, photorealistic, 16:9 aspect ratio, ultra high resolution",
  tasks: "Team collaboration board with tasks and sticky notes, modern office setting, organized workspace, project management tools, photorealistic, 16:9 aspect ratio, ultra high resolution",
  analytics: "Multiple monitors displaying real-time analytics dashboards with charts and KPIs, professional command center aesthetic, photorealistic, 16:9 aspect ratio, ultra high resolution",
  integrations: "Connected API nodes and integration symbols in modern tech environment, puzzle pieces connecting, digital ecosystem, professional aesthetic, photorealistic, 16:9 aspect ratio, ultra high resolution",
  mobile: "Modern smartphone displaying nonprofit mobile app interface, held in professional hands, iOS and Android devices side by side, clean background, professional product photography, photorealistic, 16:9 aspect ratio, ultra high resolution"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cardType } = await req.json();
    
    if (!cardType || !IMAGE_PROMPTS[cardType]) {
      throw new Error(`Invalid card type: ${cardType}`);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Generating image for card type: ${cardType}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: IMAGE_PROMPTS[cardType]
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(data));
      throw new Error('No image generated');
    }

    console.log(`Successfully generated image for ${cardType}`);

    return new Response(
      JSON.stringify({ 
        imageUrl,
        cardType 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-product-images:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
