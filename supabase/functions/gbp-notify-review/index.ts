import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reviewId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get review with organization and profile details
    const { data: review, error: reviewError } = await supabaseClient
      .from('gbp_reviews')
      .select(`
        *,
        gbp_profiles (
          business_name,
          organization_id,
          organizations (
            name,
            memberships (
              user_id,
              role,
              profiles (user_id, display_name, email:user_id)
            )
          )
        )
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      throw new Error('Review not found');
    }

    // Get organization owners/admins
    const members = review.gbp_profiles?.organizations?.memberships || [];
    const admins = members.filter((m: any) => ['owner', 'admin'].includes(m.role));

    if (!admins.length) {
      console.log('No admins found for notification');
      return new Response(
        JSON.stringify({ success: false, message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user emails from auth.users
    const { data: users } = await supabaseClient.auth.admin.listUsers();
    const adminEmails = admins
      .map((admin: any) => {
        const user = users.users.find((u: any) => u.id === admin.user_id);
        return user?.email;
      })
      .filter(Boolean);

    if (!adminEmails.length) {
      throw new Error('No admin emails found');
    }

    const businessName = review.gbp_profiles?.business_name;
    const stars = '⭐'.repeat(review.rating);
    const dashboardUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard/gbp?tab=reviews`;
    const approveUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/gbp-quick-approve?token=${reviewId}`;

    // Send email to each admin
    for (const email of adminEmails) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .review-card { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .response-card { background: #f0f4ff; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; border-radius: 5px; text-decoration: none; font-weight: bold; }
            .button-approve { background: #10b981; color: white; }
            .button-edit { background: #3b82f6; color: white; }
            .stars { color: #fbbf24; font-size: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Google Review</h1>
              <p>You received a new review for ${businessName}</p>
            </div>
            <div class="content">
              <div class="review-card">
                <div class="stars">${stars}</div>
                <p><strong>${review.reviewer_name}</strong> left a review:</p>
                <p><em>${review.review_text || 'No text provided'}</em></p>
                <p style="color: #6b7280; font-size: 12px;">
                  ${new Date(review.review_date).toLocaleDateString()}
                </p>
              </div>

              <div class="response-card">
                <h3>🤖 AI-Suggested Response:</h3>
                <p>${review.ai_generated_response}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${approveUrl}" class="button button-approve">✓ Approve & Post</a>
                <a href="${dashboardUrl}" class="button button-edit">✏️ Edit Response</a>
              </div>

              <p style="text-align: center; color: #6b7280; font-size: 14px;">
                You can also manage this review in your 
                <a href="${dashboardUrl}" style="color: #3b82f6;">dashboard</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'CauseIO Reviews <reviews@causeio.ai>',
          to: email,
          subject: `New ${review.rating}-Star Review for ${businessName}`,
          html: emailHtml,
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, notified: adminEmails.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Notification error:', error);
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
