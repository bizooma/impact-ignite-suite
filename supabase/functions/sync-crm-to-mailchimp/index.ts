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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { mapping_id } = await req.json();

    console.log('Starting Mailchimp sync for mapping:', mapping_id);

    // Get mapping details
    const { data: mapping, error: mappingError } = await supabaseClient
      .from('crm_mailchimp_mappings')
      .select('*, crm_lists(*)')
      .eq('id', mapping_id)
      .single();

    if (mappingError || !mapping) {
      throw new Error('Mapping not found');
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('*')
      .eq('organization_id', mapping.organization_id)
      .eq('provider', 'mailchimp')
      .eq('status', 'active')
      .single();

    if (integrationError || !integration) {
      throw new Error('Mailchimp integration not found or inactive');
    }

    const apiKey = integration.encrypted_tokens?.api_key;
    if (!apiKey) {
      throw new Error('Mailchimp API key not found');
    }

    // Extract datacenter from API key
    const dc = apiKey.split('-')[1];
    if (!dc) {
      throw new Error('Invalid Mailchimp API key format');
    }

    // Create sync log
    const { data: syncLog, error: logError } = await supabaseClient
      .from('crm_mailchimp_sync_logs')
      .insert({
        mapping_id,
        status: 'running',
      })
      .select()
      .single();

    if (logError) {
      throw new Error('Failed to create sync log');
    }

    // Get contacts from the list
    const { data: memberships } = await supabaseClient
      .from('crm_list_memberships')
      .select('contact_id, crm_contacts(*)')
      .eq('list_id', mapping.crm_list_id);

    const contacts = memberships?.map((m: any) => m.crm_contacts).filter(Boolean) || [];

    console.log(`Syncing ${contacts.length} contacts to Mailchimp`);

    let contactsAdded = 0;
    let contactsUpdated = 0;
    let contactsFailed = 0;
    const errors: any[] = [];

    const fieldMappings = mapping.field_mappings || {};
    const syncOptions = mapping.sync_options || {};

    // Process contacts in batches of 500
    const batchSize = 500;
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      const operations = [];

      for (const contact of batch) {
        // Skip if not opted in for email
        if (!contact.opted_in_email) {
          console.log(`Skipping contact ${contact.email} - not opted in`);
          continue;
        }

        if (!contact.email) {
          console.log(`Skipping contact ${contact.id} - no email`);
          contactsFailed++;
          continue;
        }

        // Build member data
        const mergeFields: any = {};
        
        if (contact.first_name && fieldMappings.first_name) {
          mergeFields[fieldMappings.first_name] = contact.first_name;
        }
        if (contact.last_name && fieldMappings.last_name) {
          mergeFields[fieldMappings.last_name] = contact.last_name;
        }
        if (contact.phone && fieldMappings.phone) {
          mergeFields[fieldMappings.phone] = contact.phone;
        }
        if (contact.organization_name && fieldMappings.organization_name) {
          mergeFields[fieldMappings.organization_name] = contact.organization_name;
        }

        const memberData = {
          email_address: contact.email,
          status: syncOptions.double_optin ? 'pending' : 'subscribed',
          merge_fields: mergeFields,
          tags: syncOptions.sync_tags ? contact.tags || [] : [],
        };

        operations.push({ contact, memberData });
      }

      // Batch operations
      const batchOperations = {
        operations: operations.map(({ contact, memberData }) => ({
          method: 'PUT',
          path: `/lists/${mapping.mailchimp_audience_id}/members/${encodeURIComponent(contact.email.toLowerCase())}`,
          body: JSON.stringify({
            ...memberData,
            status_if_new: memberData.status,
          }),
        })),
      };

      try {
        const response = await fetch(
          `https://${dc}.api.mailchimp.com/3.0/batches`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batchOperations),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error('Mailchimp batch error:', result);
          errors.push(result);
          contactsFailed += operations.length;
        } else {
          console.log('Batch submitted successfully:', result.id);
          // Note: We're counting as added for now, in a real implementation
          // you'd poll the batch status to get exact counts
          contactsAdded += operations.length;
        }
      } catch (error: any) {
        console.error('Batch operation failed:', error);
        errors.push({ error: error.message, batch: i / batchSize });
        contactsFailed += operations.length;
      }
    }

    // Update sync log
    await supabaseClient
      .from('crm_mailchimp_sync_logs')
      .update({
        sync_completed_at: new Date().toISOString(),
        contacts_processed: contacts.length,
        contacts_added: contactsAdded,
        contacts_updated: contactsUpdated,
        contacts_failed: contactsFailed,
        error_details: errors.length > 0 ? { errors } : {},
        status: contactsFailed > 0 ? (contactsAdded > 0 ? 'partial' : 'failed') : 'success',
      })
      .eq('id', syncLog.id);

    // Update mapping
    await supabaseClient
      .from('crm_mailchimp_mappings')
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_status: contactsFailed > 0 ? 'error' : 'success',
        last_sync_error: errors.length > 0 ? JSON.stringify(errors[0]) : null,
      })
      .eq('id', mapping_id);

    return new Response(
      JSON.stringify({
        success: true,
        contacts_processed: contacts.length,
        contacts_added: contactsAdded,
        contacts_updated: contactsUpdated,
        contacts_failed: contactsFailed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
