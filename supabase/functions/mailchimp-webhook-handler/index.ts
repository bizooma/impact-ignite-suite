import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";

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

    const webhookData = await req.json();
    
    console.log('Received Mailchimp webhook:', webhookData.type);

    const eventType = webhookData.type;
    const email = webhookData.data?.email;
    const listId = webhookData.data?.list_id;

    if (!email || !listId) {
      console.log('Invalid webhook data - missing email or list_id');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Find the mapping for this list
    const { data: mapping } = await supabaseClient
      .from('crm_mailchimp_mappings')
      .select('*')
      .eq('mailchimp_audience_id', listId)
      .single();

    if (!mapping) {
      console.log('No mapping found for list:', listId);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Find the contact by email
    const { data: contact } = await supabaseClient
      .from('crm_contacts')
      .select('*')
      .eq('organization_id', mapping.organization_id)
      .eq('email', email)
      .single();

    if (!contact) {
      console.log('Contact not found:', email);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle different webhook events
    switch (eventType) {
      case 'unsubscribe':
        console.log('Processing unsubscribe for:', email);
        await supabaseClient
          .from('crm_contacts')
          .update({ opted_in_email: false })
          .eq('id', contact.id);

        await supabaseClient
          .from('crm_interactions')
          .insert({
            contact_id: contact.id,
            organization_id: mapping.organization_id,
            interaction_type: 'email_unsubscribe',
            source_module: 'mailchimp',
            description: 'Contact unsubscribed from Mailchimp',
            interaction_date: new Date().toISOString(),
          });
        break;

      case 'subscribe':
        console.log('Processing subscribe for:', email);
        await supabaseClient
          .from('crm_contacts')
          .update({ opted_in_email: true })
          .eq('id', contact.id);

        await supabaseClient
          .from('crm_interactions')
          .insert({
            contact_id: contact.id,
            organization_id: mapping.organization_id,
            interaction_type: 'email_subscribe',
            source_module: 'mailchimp',
            description: 'Contact subscribed via Mailchimp',
            interaction_date: new Date().toISOString(),
          });
        break;

      case 'profile':
        console.log('Processing profile update for:', email);
        const updates: any = {};
        
        if (webhookData.data?.merges?.FNAME) {
          updates.first_name = webhookData.data.merges.FNAME;
        }
        if (webhookData.data?.merges?.LNAME) {
          updates.last_name = webhookData.data.merges.LNAME;
        }
        if (webhookData.data?.merges?.PHONE) {
          updates.phone = webhookData.data.merges.PHONE;
        }

        if (Object.keys(updates).length > 0) {
          await supabaseClient
            .from('crm_contacts')
            .update(updates)
            .eq('id', contact.id);
        }
        break;

      case 'cleaned':
        console.log('Processing cleaned (bounce) for:', email);
        await supabaseClient
          .from('crm_contacts')
          .update({ opted_in_email: false })
          .eq('id', contact.id);

        await supabaseClient
          .from('crm_interactions')
          .insert({
            contact_id: contact.id,
            organization_id: mapping.organization_id,
            interaction_type: 'email_bounce',
            source_module: 'mailchimp',
            description: 'Email address bounced in Mailchimp',
            interaction_date: new Date().toISOString(),
          });
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('OK', { status: 200, headers: corsHeaders });
  }
});
