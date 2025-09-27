import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { knowledgeSourceId, content, type, name } = await req.json();
    console.log('Processing knowledge source:', { knowledgeSourceId, type, name });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update knowledge source status to processing
    await supabase
      .from('knowledge_sources')
      .update({ status: 'processing' })
      .eq('id', knowledgeSourceId);

    let processedContent = content;

    // Process different content types
    if (type === 'url') {
      // Fetch content from URL
      try {
        const response = await fetch(content);
        const html = await response.text();
        // Simple HTML to text conversion (in production, use a proper HTML parser)
        processedContent = html
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<style[^>]*>.*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      } catch (error) {
        console.error('Error fetching URL content:', error);
        throw new Error('Failed to fetch content from URL');
      }
    } else if (type === 'file') {
      // For file uploads, content should already be extracted
      // In a full implementation, you'd handle different file types
      processedContent = content;
    }

    // Chunk content for better processing
    const chunks = chunkText(processedContent, 1000); // 1000 chars per chunk

    // Generate embeddings for each chunk using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const embeddings = [];
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
          throw new Error('Failed to generate embedding');
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        embeddings.push({
          knowledge_source_id: knowledgeSourceId,
          content_chunk: chunk,
          embedding: embedding,
          metadata: {
            chunk_index: embeddings.length,
            chunk_length: chunk.length
          }
        });
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
        // Continue with other chunks even if one fails
      }
    }

    // Store embeddings in database
    if (embeddings.length > 0) {
      const { error: embeddingError } = await supabase
        .from('knowledge_embeddings')
        .insert(embeddings);

      if (embeddingError) {
        console.error('Error storing embeddings:', embeddingError);
        throw new Error('Failed to store embeddings');
      }
    }

    // Update knowledge source with processed content and status
    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({ 
        content: processedContent,
        status: 'processed',
        metadata: {
          ...{},
          chunks_count: chunks.length,
          embeddings_count: embeddings.length,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', knowledgeSourceId);

    if (updateError) {
      console.error('Error updating knowledge source:', updateError);
      throw new Error('Failed to update knowledge source');
    }

    return new Response(JSON.stringify({
      success: true,
      chunksProcessed: chunks.length,
      embeddingsGenerated: embeddings.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-knowledge:', error);
    
    // Try to update status to failed
    if (req.json && (await req.json()).knowledgeSourceId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('knowledge_sources')
          .update({ status: 'failed' })
          .eq('id', (await req.json()).knowledgeSourceId);
      } catch (updateError) {
        console.error('Error updating failed status:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to process knowledge source' 
    }), {
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