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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is Bizooma member
    const { data: bizoomaOrg, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id')
      .eq('slug', 'bizooma')
      .single();

    if (orgError || !bizoomaOrg) {
      return new Response(JSON.stringify({ error: 'Bizooma organization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: membership } = await supabaseClient
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', bizoomaOrg.id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: 'Only Bizooma members can manage flipbook embeds' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, flipbookId, organizationIds, position } = await req.json();

    switch (action) {
      case 'assign': {
        // Assign flipbook to multiple organizations
        const embeds = organizationIds.map((orgId: string, index: number) => ({
          flipbook_id: flipbookId,
          organization_id: orgId,
          position: position !== undefined ? position + index : index,
        }));

        const { data, error } = await supabaseClient
          .from('flipbook_embeds')
          .upsert(embeds, { onConflict: 'flipbook_id,organization_id' })
          .select();

        if (error) throw error;

        return new Response(JSON.stringify({ embeds: data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'unassign': {
        const { error } = await supabaseClient
          .from('flipbook_embeds')
          .delete()
          .eq('flipbook_id', flipbookId)
          .in('organization_id', organizationIds);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-position': {
        const { embedId, newPosition } = await req.json();
        const { error } = await supabaseClient
          .from('flipbook_embeds')
          .update({ position: newPosition })
          .eq('id', embedId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in assign-flipbook-embed:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
