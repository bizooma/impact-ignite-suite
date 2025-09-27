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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { postId, platform } = await req.json();

    console.log('Publishing post:', { postId, platform });

    // Get the post data
    const { data: post, error: postError } = await supabaseClient
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error('Error fetching post:', postError);
      throw new Error(`Failed to fetch post: ${postError.message}`);
    }

    console.log('Post data:', post);

    // For now, we'll just simulate publishing
    // In a real implementation, you would integrate with social media APIs
    const publishResult = {
      success: true,
      platform: platform,
      external_post_id: `${platform}_${Date.now()}`,
      published_at: new Date().toISOString(),
      message: `Successfully published to ${platform}`
    };

    // Update the post status
    const { error: updateError } = await supabaseClient
      .from('social_posts')
      .update({
        status: 'published',
        published_at: publishResult.published_at,
        external_post_id: publishResult.external_post_id
      })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post:', updateError);
      throw new Error(`Failed to update post: ${updateError.message}`);
    }

    console.log('Post published successfully:', publishResult);

    return new Response(JSON.stringify(publishResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in social-publisher function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});