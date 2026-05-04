/**
 * import-brand-kit-from-pdf
 *
 * Extracts brand identity from a PDF brand guide:
 *   1. Caller (browser) renders PDF pages to PNG data URLs and uploads the PDF.
 *   2. We send the PDF + page images to Gemini 2.5 Pro and ask it to return
 *      colors, fonts, voice, AND bounding boxes for every logo it sees.
 *   3. For each logo bbox, we crop the corresponding page PNG with imagescript,
 *      upload the crop to the `brand-kits` storage bucket, and return its URL.
 *   4. The dialog applies primary/mark logos to the brand kit automatically.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { decode as decodePng, Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EXTRACTION_TOOL = {
  type: 'function',
  function: {
    name: 'record_brand_extraction',
    description:
      'Record brand identity attributes extracted from a brand guide PDF, including precise bounding boxes for every visible logo.',
    parameters: {
      type: 'object',
      properties: {
        colors: {
          type: 'array',
          description: 'Brand colors. Up to 12. Each must include a #RRGGBB hex.',
          items: {
            type: 'object',
            properties: {
              hex: { type: 'string', description: 'Hex color, e.g. "#1E40AF"' },
              role: {
                type: 'string',
                description: 'Role: primary, secondary, accent, text, background, neutral, or empty string.',
              },
              label: { type: 'string', description: 'Color name from the guide if any.' },
            },
            required: ['hex', 'role', 'label'],
            additionalProperties: false,
          },
        },
        fonts: {
          type: 'array',
          description: 'Typography. Up to 6.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              usage: { type: 'string', enum: ['heading', 'body', 'unknown'] },
            },
            required: ['name', 'usage'],
            additionalProperties: false,
          },
        },
        logos: {
          type: 'array',
          description:
            'Every distinct logo image visible in the guide. Bounding boxes use normalized 0..1 coordinates measured from the TOP-LEFT of the corresponding page image. Up to 6 logos. Skip decorative icons and isolated wordmarks that are not logos. If two logo variants overlap on the page, return them separately.',
          items: {
            type: 'object',
            properties: {
              page_number: { type: 'number', description: '1-indexed page number from the supplied page images.' },
              x: { type: 'number', description: 'Left edge, 0..1' },
              y: { type: 'number', description: 'Top edge, 0..1' },
              width: { type: 'number', description: 'Width, 0..1' },
              height: { type: 'number', description: 'Height, 0..1' },
              variant: {
                type: 'string',
                description: 'primary, mark, light, dark, or empty string.',
              },
            },
            required: ['page_number', 'x', 'y', 'width', 'height', 'variant'],
            additionalProperties: false,
          },
        },
        tagline: { type: 'string' },
        mission_statement: { type: 'string' },
        voice_descriptors: {
          type: 'array',
          description: 'Short adjectives for brand voice. Max 8.',
          items: { type: 'string' },
        },
      },
      required: [
        'colors',
        'fonts',
        'logos',
        'tagline',
        'mission_statement',
        'voice_descriptors',
      ],
      additionalProperties: false,
    },
  },
} as const;

interface PageImage {
  page_number: number;
  data_url: string;
  width: number;
  height: number;
}

interface ReqBody {
  organization_id: string;
  pdf_file_path: string;
  page_images?: PageImage[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return jsonResponse({ error: 'LOVABLE_API_KEY not configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization' }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const body = (await req.json()) as ReqBody;
    if (!body?.organization_id || !body?.pdf_file_path) {
      return jsonResponse({ error: 'organization_id and pdf_file_path required' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: membership } = await admin
      .from('memberships')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('organization_id', body.organization_id)
      .maybeSingle();
    if (!membership) return jsonResponse({ error: 'Not a member of this org' }, 403);

    const { data: importRow, error: importErr } = await admin
      .from('brand_kit_imports')
      .insert({
        organization_id: body.organization_id,
        pdf_file_path: body.pdf_file_path,
        status: 'processing',
        extracted_data: {},
      })
      .select()
      .single();
    if (importErr) throw importErr;

    try {
      // Download the source PDF for the AI call (gives Gemini full text + layout).
      const { data: fileBlob, error: dlErr } = await admin.storage
        .from('brand-kits')
        .download(body.pdf_file_path);
      if (dlErr || !fileBlob) throw dlErr || new Error('Failed to download PDF');

      const arrayBuffer = await fileBlob.arrayBuffer();
      const pdfBase64 = arrayBufferToBase64(arrayBuffer);
      const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

      // Build user content: PDF first, then each page image so Gemini can
      // ground the bounding boxes against the same images we'll crop from.
      const pageImages = body.page_images ?? [];
      const userContent: any[] = [
        {
          type: 'text',
          text:
            'Extract the brand colors, fonts, tagline, mission, voice descriptors, AND every logo image from this brand guide. ' +
            'I have rendered the first ' + pageImages.length + ' pages as separate images, in order, immediately after the PDF. ' +
            'For each logo, return its page_number (1-indexed) and a normalized bounding box in the SAME coordinate space as those page images (origin top-left, 0..1). ' +
            'Be tight — boxes should hug the logo with minimal whitespace. Do NOT return decorative icons, photographs, or pure typographic blocks.',
        },
        { type: 'image_url', image_url: { url: pdfDataUrl } },
        ...pageImages.map(p => ({
          type: 'image_url' as const,
          image_url: { url: p.data_url },
        })),
      ];

      const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: 'system',
              content:
                'You are a brand identity analyst. Inspect the attached brand guide PDF and the per-page images, then return ONLY structured data via the record_brand_extraction tool. Be precise with hex codes and tight with logo bounding boxes. If something is not stated, use empty values — never invent.',
            },
            { role: 'user', content: userContent },
          ],
          tools: [EXTRACTION_TOOL],
          tool_choice: { type: 'function', function: { name: 'record_brand_extraction' } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        if (aiResp.status === 429) throw new Error('Rate limit exceeded. Try again in a moment.');
        if (aiResp.status === 402) throw new Error('AI credits exhausted. Add credits in Settings → Workspace → Usage.');
        throw new Error(`AI gateway error (${aiResp.status}): ${errText.slice(0, 200)}`);
      }

      const aiJson = await aiResp.json();
      const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error('AI did not return structured extraction');

      let extracted: any;
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error('Could not parse AI extraction');
      }

      // ── Normalize colors ───────────────────────────────────────
      const normColors = (extracted.colors || [])
        .map((c: any) => {
          const v = String(c.hex || '').trim().replace(/^#/, '');
          let hex: string | null = null;
          if (/^[0-9a-fA-F]{3}$/.test(v)) {
            hex = '#' + v.split('').map((ch: string) => ch + ch).join('').toUpperCase();
          } else if (/^[0-9a-fA-F]{6}$/.test(v)) {
            hex = '#' + v.toUpperCase();
          }
          return hex ? { hex, role: c.role || '', label: c.label || '' } : null;
        })
        .filter(Boolean)
        .slice(0, 12);

      // ── Crop & upload logos ────────────────────────────────────
      const pageMap = new Map<number, PageImage>();
      for (const p of pageImages) pageMap.set(p.page_number, p);

      const decodedPages = new Map<number, Image>();
      const uploadedLogos: Array<{ storage_path: string; url: string; width: number; height: number; variant: string }> = [];

      const candidates = (extracted.logos || []).slice(0, 6);
      for (let idx = 0; idx < candidates.length; idx++) {
        const l = candidates[idx];
        const page = pageMap.get(Number(l.page_number));
        if (!page) continue;

        // Validate bbox
        const x = clamp01(Number(l.x));
        const y = clamp01(Number(l.y));
        const w = clamp01(Number(l.width));
        const h = clamp01(Number(l.height));
        if (w < 0.02 || h < 0.02) continue; // too small to be a real logo

        // Decode page PNG once and reuse
        let img = decodedPages.get(page.page_number);
        if (!img) {
          try {
            const bytes = dataUrlToBytes(page.data_url);
            img = (await decodePng(bytes)) as Image;
            decodedPages.set(page.page_number, img);
          } catch (e) {
            console.warn('Failed to decode page', page.page_number, e);
            continue;
          }
        }

        const px = Math.max(0, Math.floor(x * img.width));
        const py = Math.max(0, Math.floor(y * img.height));
        const pw = Math.min(img.width - px, Math.ceil(w * img.width));
        const ph = Math.min(img.height - py, Math.ceil(h * img.height));
        if (pw <= 1 || ph <= 1) continue;

        try {
          const cropped = img.clone().crop(px, py, pw, ph);
          const pngBytes = await cropped.encode();

          const storagePath = `${body.organization_id}/imports/logos/${importRow.id}-${idx}.png`;
          const { error: upErr } = await admin.storage
            .from('brand-kits')
            .upload(storagePath, pngBytes, {
              contentType: 'image/png',
              upsert: true,
            });
          if (upErr) {
            console.warn('Logo upload failed', upErr);
            continue;
          }

          const { data: pub } = admin.storage.from('brand-kits').getPublicUrl(storagePath);
          uploadedLogos.push({
            storage_path: storagePath,
            url: pub.publicUrl,
            width: pw,
            height: ph,
            variant: typeof l.variant === 'string' ? l.variant : '',
          });
        } catch (e) {
          console.warn('Logo crop/upload failed', e);
        }
      }

      const finalExtracted = {
        colors: normColors,
        fonts: (extracted.fonts || []).slice(0, 6),
        logos: uploadedLogos,
        tagline: extracted.tagline || '',
        mission_statement: extracted.mission_statement || '',
        voice_descriptors: (extracted.voice_descriptors || []).slice(0, 8),
      };

      await admin
        .from('brand_kit_imports')
        .update({ status: 'completed', extracted_data: finalExtracted })
        .eq('id', importRow.id);

      return jsonResponse({
        import_id: importRow.id,
        extracted_data: finalExtracted,
      });
    } catch (innerErr: any) {
      console.error('Extraction failed:', innerErr);
      await admin
        .from('brand_kit_imports')
        .update({
          status: 'error',
          error_message: innerErr?.message || 'Unknown error',
        })
        .eq('id', importRow.id);
      return jsonResponse({ error: innerErr?.message || 'Extraction failed' }, 500);
    }
  } catch (e: any) {
    console.error('import-brand-kit-from-pdf error:', e);
    return jsonResponse({ error: e?.message || 'Unknown error' }, 500);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('Invalid data URL');
  const b64 = dataUrl.slice(comma + 1);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
