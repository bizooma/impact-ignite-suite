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
      return new Response(JSON.stringify({ error: 'Only Bizooma members can manage flipbooks' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, flipbookData } = await req.json();

    switch (action) {
      case 'create': {
        const { data: flipbook, error } = await supabaseClient
          .from('flipbooks')
          .insert({
            organization_id: bizoomaOrg.id,
            title: flipbookData.title,
            description: flipbookData.description,
            pdf_url: flipbookData.pdf_url,
            thumbnail_url: flipbookData.thumbnail_url,
            page_count: flipbookData.page_count,
            file_size: flipbookData.file_size,
            created_by: user.id,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ flipbook }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { id, ...updates } = flipbookData;
        const { data: flipbook, error } = await supabaseClient
          .from('flipbooks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ flipbook }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { id } = flipbookData;
        
        // Delete associated file from storage
        const { data: flipbook } = await supabaseClient
          .from('flipbooks')
          .select('pdf_url, thumbnail_url')
          .eq('id', id)
          .single();

        if (flipbook?.pdf_url) {
          const fileName = flipbook.pdf_url.split('/').pop();
          await supabaseClient.storage.from('flipbooks').remove([fileName]);
        }

        if (flipbook?.thumbnail_url) {
          const thumbnailName = flipbook.thumbnail_url.split('/').pop();
          await supabaseClient.storage.from('flipbooks').remove([thumbnailName]);
        }

        const { error } = await supabaseClient
          .from('flipbooks')
          .delete()
          .eq('id', id);

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
    console.error('Error in manage-flipbook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
