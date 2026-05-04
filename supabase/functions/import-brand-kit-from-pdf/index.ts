/**
 * import-brand-kit-from-pdf
 *
 * Reads a PDF from the `brand-kits` storage bucket, sends it to Lovable AI
 * (Gemini multimodal) to extract colors, fonts, tagline, mission, and voice
 * descriptors, then writes a row to `brand_kit_imports` and returns the
 * structured payload for the review screen.
 *
 * Note: image/logo extraction from embedded PDF objects is intentionally
 * deferred — the AI can describe logos but pulling raw bitmaps requires a
 * native PDF parser. We return any image candidates the AI references so the
 * UI can prompt the user to upload logos manually if missing.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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
      'Record brand identity attributes extracted from a brand guide PDF.',
    parameters: {
      type: 'object',
      properties: {
        colors: {
          type: 'array',
          description:
            'Brand colors found in the document. Up to 12. Each must include a #RRGGBB hex.',
          items: {
            type: 'object',
            properties: {
              hex: {
                type: 'string',
                description: 'Hex color, e.g. "#1E40AF"',
              },
              role: {
                type: 'string',
                description:
                  'Role if known: primary, secondary, accent, text, background, neutral, or empty string.',
              },
              label: {
                type: 'string',
                description: 'Color name from the guide if any, else empty string.',
              },
            },
            required: ['hex', 'role', 'label'],
            additionalProperties: false,
          },
        },
        fonts: {
          type: 'array',
          description: 'Typography mentioned in the guide. Up to 6.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Font family name as written.' },
              usage: {
                type: 'string',
                enum: ['heading', 'body', 'unknown'],
              },
            },
            required: ['name', 'usage'],
            additionalProperties: false,
          },
        },
        tagline: { type: 'string', description: 'Tagline / slogan, or empty string.' },
        mission_statement: {
          type: 'string',
          description: 'Mission statement, or empty string.',
        },
        voice_descriptors: {
          type: 'array',
          description:
            'Short adjectives describing brand voice (e.g. "warm", "bold"). Max 8.',
          items: { type: 'string' },
        },
      },
      required: [
        'colors',
        'fonts',
        'tagline',
        'mission_statement',
        'voice_descriptors',
      ],
      additionalProperties: false,
    },
  },
} as const;

interface ReqBody {
  organization_id: string;
  pdf_file_path: string;
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

    // Auth check — caller must be a member of the org
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

    // Membership check
    const { data: membership } = await admin
      .from('memberships')
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('organization_id', body.organization_id)
      .maybeSingle();
    if (!membership) return jsonResponse({ error: 'Not a member of this org' }, 403);

    // Create import record (processing)
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
      // Download PDF from storage and convert to base64 data URL for Gemini
      const { data: fileBlob, error: dlErr } = await admin.storage
        .from('brand-kits')
        .download(body.pdf_file_path);
      if (dlErr || !fileBlob) throw dlErr || new Error('Failed to download PDF');

      const arrayBuffer = await fileBlob.arrayBuffer();
      const base64 = arrayBufferToBase64(arrayBuffer);
      const dataUrl = `data:application/pdf;base64,${base64}`;

      // Call Lovable AI Gateway with multimodal PDF input + tool calling
      const aiResp = await fetch(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
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
                  'You are a brand identity analyst. Inspect the attached brand guide PDF and extract its visual identity. Return ONLY structured data via the record_brand_extraction tool. Be precise with hex codes. If something is not stated, use an empty string or empty array — do not invent values.',
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract the brand colors, fonts, tagline, mission, and voice descriptors from this brand guide.',
                  },
                  {
                    type: 'image_url',
                    image_url: { url: dataUrl },
                  },
                ],
              },
            ],
            tools: [EXTRACTION_TOOL],
            tool_choice: {
              type: 'function',
              function: { name: 'record_brand_extraction' },
            },
          }),
        },
      );

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        if (aiResp.status === 429) {
          throw new Error('Rate limit exceeded. Try again in a moment.');
        }
        if (aiResp.status === 402) {
          throw new Error(
            'AI credits exhausted. Add credits in Settings → Workspace → Usage.',
          );
        }
        throw new Error(`AI gateway error (${aiResp.status}): ${errText.slice(0, 200)}`);
      }

      const aiJson = await aiResp.json();
      const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) {
        throw new Error('AI did not return structured extraction');
      }

      let extracted: any;
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        throw new Error('Could not parse AI extraction');
      }

      // Normalize colors: ensure #RRGGBB uppercase, drop anything invalid
      const normColors = (extracted.colors || [])
        .map((c: any) => {
          const v = String(c.hex || '').trim().replace(/^#/, '');
          let hex: string | null = null;
          if (/^[0-9a-fA-F]{3}$/.test(v)) {
            hex = '#' + v.split('').map((ch: string) => ch + ch).join('').toUpperCase();
          } else if (/^[0-9a-fA-F]{6}$/.test(v)) {
            hex = '#' + v.toUpperCase();
          }
          return hex
            ? { hex, role: c.role || '', label: c.label || '' }
            : null;
        })
        .filter(Boolean)
        .slice(0, 12);

      const finalExtracted = {
        colors: normColors,
        fonts: (extracted.fonts || []).slice(0, 6),
        logos: [], // Logo bitmap extraction deferred — UI prompts manual upload
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
      return jsonResponse(
        { error: innerErr?.message || 'Extraction failed' },
        500,
      );
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
