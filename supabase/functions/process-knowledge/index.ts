import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { extractText, getDocumentProxy } from 'https://esm.sh/unpdf@0.12.1';
import mammoth from 'https://esm.sh/mammoth@1.8.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let knowledgeSourceId: string | undefined;

  try {
    const body = await req.json();
    knowledgeSourceId = body.knowledgeSourceId;
    const { content, type, name, filePath } = body;
    console.log('Processing knowledge source:', { knowledgeSourceId, type, name, filePath });

    await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('id', knowledgeSourceId);

    // Resolve org for usage logging + BYO key lookup
    const { data: ksRow } = await supabase
      .from('knowledge_sources')
      .select('chatbot_id, chatbots:chatbot_id(organization_id)')
      .eq('id', knowledgeSourceId)
      .maybeSingle();
    const orgId = (ksRow?.chatbots as any)?.organization_id as string | undefined;

    let byoKey: string | undefined;
    if (orgId) {
      const { data: openaiIntegration } = await supabase
        .from('integrations')
        .select('vault_secret_id')
        .eq('organization_id', orgId)
        .eq('provider', 'openai')
        .eq('status', 'active')
        .maybeSingle();
      if (openaiIntegration?.vault_secret_id) {
        const { data: secret } = await supabase.rpc(
          'get_integration_vault_secret_internal',
          { _org_id: orgId, _provider: 'openai' },
        );
        byoKey = (secret as string | null) ?? undefined;
      }
    }
    const usingByoKey = !!byoKey;
    const apiKey = byoKey ?? Deno.env.get('OPENAI_API_KEY');

    let processedContent = content;

    if (type === 'url') {
      try {
        const response = await fetch(content);
        const html = await response.text();
        processedContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (error) {
        throw new Error(`Failed to fetch content from URL: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    } else if (type === 'pdf' || type === 'docx') {
      if (!filePath) throw new Error(`filePath is required for ${type} sources`);
      const { data: fileBlob, error: dlErr } = await supabase
        .storage.from('knowledge-sources').download(filePath);
      if (dlErr || !fileBlob) throw new Error(`Failed to download file: ${dlErr?.message || 'unknown'}`);
      const buffer = new Uint8Array(await fileBlob.arrayBuffer());

      if (type === 'pdf') {
        const pdf = await getDocumentProxy(buffer);
        const { text } = await extractText(pdf, { mergePages: true });
        processedContent = (Array.isArray(text) ? text.join('\n') : text).trim();
      } else {
        const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
        processedContent = (result?.value || '').trim();
      }
    } else if (type === 'file' || type === 'text') {
      processedContent = content;
    }

    if (!processedContent || !processedContent.trim()) {
      throw new Error('No content to process');
    }

    const chunks = chunkText(processedContent, 1000);
    const embeddings: any[] = [];
    let totalEmbedTokens = 0;

    if (apiKey) {
      for (const chunk of chunks) {
        try {
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: chunk }),
          });
          if (!embeddingResponse.ok) {
            console.error('Failed to generate embedding:', await embeddingResponse.text());
            continue;
          }
          const embeddingData = await embeddingResponse.json();
          totalEmbedTokens += embeddingData.usage?.total_tokens ?? 0;
          embeddings.push({
            knowledge_source_id: knowledgeSourceId,
            content_chunk: chunk,
            embedding: embeddingData.data[0].embedding,
            metadata: { chunk_index: embeddings.length, chunk_length: chunk.length },
          });
        } catch (error) {
          console.error('Error generating embedding for chunk:', error);
        }
      }

      if (embeddings.length > 0) {
        await supabase.from('knowledge_embeddings').insert(embeddings);
      }

      // Log usage (one event for the whole batch)
      if (orgId && totalEmbedTokens > 0) {
        await supabase.from('ai_usage_events').insert({
          organization_id: orgId,
          chatbot_id: ksRow?.chatbot_id ?? null,
          event_type: 'embedding',
          model: 'text-embedding-3-small',
          tokens_input: totalEmbedTokens,
          used_byo_key: usingByoKey,
          metadata: { source: 'process-knowledge', chunks: embeddings.length },
        });
      }
    } else {
      console.warn('No OpenAI key available — skipping embeddings.');
    }

    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({
        content: processedContent,
        status: 'completed',
        metadata: {
          chunks_count: chunks.length,
          embeddings_count: embeddings.length,
          processed_at: new Date().toISOString(),
        },
      })
      .eq('id', knowledgeSourceId);

    if (updateError) throw new Error('Failed to update knowledge source');

    return new Response(JSON.stringify({
      success: true,
      chunksProcessed: chunks.length,
      embeddingsGenerated: embeddings.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in process-knowledge:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process knowledge source';
    if (knowledgeSourceId) {
      try {
        await supabase
          .from('knowledge_sources')
          .update({
            status: 'error',
            metadata: { error: errorMessage, failed_at: new Date().toISOString() },
          })
          .eq('id', knowledgeSourceId);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}
