import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is platform admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_platform_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.is_platform_admin) {
      throw new Error('Insufficient privileges');
    }

    const { action, targetUserId, data: actionData } = await req.json();

    let result;

    switch (action) {
      case 'grant_admin':
        result = await supabaseClient.rpc('grant_platform_admin', {
          _email: actionData.email
        });
        
        // Log the admin action
        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'grant_platform_admin',
          target_type: 'user',
          details: { target_email: actionData.email }
        });
        break;

      case 'suspend_user':
        // In a real implementation, you'd update user status
        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'suspend_user',
          target_type: 'user',
          target_id: targetUserId,
          details: actionData
        });
        result = { success: true };
        break;

      case 'view_user_details':
        // Fetch comprehensive user details
        const { data: userDetails, error: userError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .single();

        if (userError) throw userError;

        // Get user's organizations
        const { data: memberships, error: membershipsError } = await supabaseClient
          .from('memberships')
          .select(`
            role,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', targetUserId);

        if (membershipsError) throw membershipsError;

        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'view_user_details',
          target_type: 'user',
          target_id: targetUserId
        });

        result = {
          user: userDetails,
          organizations: memberships
        };
        break;

      default:
        throw new Error('Unknown action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Admin action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred processing admin action';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});