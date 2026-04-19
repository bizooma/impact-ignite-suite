import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
    const { content, type, name } = body;
    console.log('Processing knowledge source:', { knowledgeSourceId, type, name });

    await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('id', knowledgeSourceId);

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
        console.error('Error fetching URL content:', error);
        throw new Error(`Failed to fetch content from URL: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    } else if (type === 'file') {
      // For file uploads, content is already extracted text passed in by caller
      processedContent = content;
    }

    if (!processedContent || !processedContent.trim()) {
      throw new Error('No content to process');
    }

    const chunks = chunkText(processedContent, 1000);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const embeddings: any[] = [];

    if (openAIApiKey) {
      for (const chunk of chunks) {
        try {
          const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'text-embedding-3-small',
              input: chunk,
            }),
          });

          if (!embeddingResponse.ok) {
            console.error('Failed to generate embedding:', await embeddingResponse.text());
            continue;
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data[0].embedding;

          embeddings.push({
            knowledge_source_id: knowledgeSourceId,
            content_chunk: chunk,
            embedding,
            metadata: {
              chunk_index: embeddings.length,
              chunk_length: chunk.length,
            },
          });
        } catch (error) {
          console.error('Error generating embedding for chunk:', error);
        }
      }

      if (embeddings.length > 0) {
        const { error: embeddingError } = await supabase
          .from('knowledge_embeddings')
          .insert(embeddings);

        if (embeddingError) {
          console.error('Error storing embeddings:', embeddingError);
        }
      }
    } else {
      console.warn('OPENAI_API_KEY not set — skipping embeddings.');
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

    if (updateError) {
      console.error('Error updating knowledge source:', updateError);
      throw new Error('Failed to update knowledge source');
    }

    return new Response(JSON.stringify({
      success: true,
      chunksProcessed: chunks.length,
      embeddingsGenerated: embeddings.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-knowledge:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process knowledge source';

    if (knowledgeSourceId) {
      try {
        await supabase
          .from('knowledge_sources')
          .update({
            status: 'error',
            metadata: {
              error: errorMessage,
              failed_at: new Date().toISOString(),
            },
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

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
