import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_key } = await req.json();

    if (!api_key) {
      throw new Error('API key is required');
    }

    // Extract datacenter from API key
    const dc = api_key.split('-')[1];
    if (!dc) {
      throw new Error('Invalid Mailchimp API key format');
    }

    console.log('Testing Mailchimp connection for datacenter:', dc);

    // Test connection by pinging API
    const pingResponse = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/ping`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_key}`,
        },
      }
    );

    if (!pingResponse.ok) {
      const error = await pingResponse.json();
      throw new Error(error.detail || 'Failed to connect to Mailchimp');
    }

    // Get account info
    const accountResponse = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_key}`,
        },
      }
    );

    if (!accountResponse.ok) {
      const error = await accountResponse.json();
      throw new Error(error.detail || 'Failed to get account info');
    }

    const accountData = await accountResponse.json();

    // Get audiences (lists)
    const listsResponse = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/lists?count=100`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_key}`,
        },
      }
    );

    if (!listsResponse.ok) {
      const error = await listsResponse.json();
      throw new Error(error.detail || 'Failed to get audiences');
    }

    const listsData = await listsResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        account: {
          name: accountData.account_name,
          email: accountData.email,
          username: accountData.username,
        },
        audiences: listsData.lists.map((list: any) => ({
          id: list.id,
          name: list.name,
          member_count: list.stats?.member_count || 0,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Connection test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
