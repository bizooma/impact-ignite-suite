import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId } = await req.json();

    if (!reviewId) {
      throw new Error('Review ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get review details with profile and organization
    const { data: review, error: reviewError } = await supabaseClient
      .from('gbp_reviews')
      .select(`
        *,
        gbp_profiles (
          business_name,
          organization_id,
          organizations (name)
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Generate AI response using Lovable AI
    const businessName = review.gbp_profiles?.business_name || review.gbp_profiles?.organizations?.name;
    const rating = review.rating;
    const reviewText = review.review_text || '';
    const reviewerName = review.reviewer_name;

    const systemPrompt = `You are a professional review responder for ${businessName}, a nonprofit organization. Generate a polite, professional response to this Google Business Profile review.

Guidelines:
- Be warm and genuine
- Thank the reviewer by name if possible
- Address specific points they mentioned
- For positive reviews (4-5 stars): express gratitude, reinforce mission
- For negative reviews (1-3 stars): show empathy, offer to resolve offline, provide contact info
- Keep it under 250 characters
- Never make promises you can't keep
- Be professional and compassionate`;

    const userPrompt = `Reviewer: ${reviewerName}
Rating: ${rating} stars
Review: ${reviewText || 'No text provided, just a rating'}

Generate an appropriate response:`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error('AI generation failed:', error);
      throw new Error('Failed to generate AI response');
    }

    const aiData = await aiResponse.json();
    const generatedResponse = aiData.choices[0]?.message?.content?.trim();

    if (!generatedResponse) {
      throw new Error('No response generated');
    }

    // Update review with AI-generated response
    const { error: updateError } = await supabaseClient
      .from('gbp_reviews')
      .update({
        ai_generated_response: generatedResponse,
        reply_status: 'awaiting_approval',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      throw updateError;
    }

    console.log(`AI response generated for review ${reviewId}`);

    // Trigger email notification
    await supabaseClient.functions.invoke('gbp-notify-review', {
      body: { reviewId },
    });

    return new Response(
      JSON.stringify({ success: true, response: generatedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate response error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
