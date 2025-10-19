import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VolunteerData {
  id: string;
  chatbot_id: string;
  name: string;
  email: string;
  phone?: string;
  days?: string[];
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { volunteer } = await req.json();

    if (!volunteer) {
      throw new Error('Volunteer data is required');
    }

    console.log('Syncing volunteer to CRM:', volunteer);

    // Get chatbot to find organization_id
    const { data: chatbot, error: chatbotError } = await supabaseClient
      .from('chatbots')
      .select('organization_id')
      .eq('id', volunteer.chatbot_id)
      .single();

    if (chatbotError || !chatbot) {
      throw new Error('Failed to find chatbot organization');
    }

    const organizationId = chatbot.organization_id;

    // Split name into first and last name
    const nameParts = volunteer.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if contact already exists by email
    const { data: existingContact } = await supabaseClient
      .from('crm_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', volunteer.email)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      // Update existing contact
      console.log('Updating existing contact:', existingContact.id);
      
      const { data: updatedContact, error: updateError } = await supabaseClient
        .from('crm_contacts')
        .update({
          lifecycle_stage: 'volunteer',
          last_interaction_at: new Date().toISOString(),
          phone: volunteer.phone || undefined,
          custom_fields: {
            volunteer_days: volunteer.days || [],
          },
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating contact:', updateError);
        throw updateError;
      }

      contactId = updatedContact.id;
    } else {
      // Create new contact
      console.log('Creating new contact for volunteer');
      
      const { data: newContact, error: createError } = await supabaseClient
        .from('crm_contacts')
        .insert({
          organization_id: organizationId,
          contact_type: 'individual',
          first_name: firstName,
          last_name: lastName,
          email: volunteer.email,
          phone: volunteer.phone,
          source: 'chatbot_volunteer',
          source_id: volunteer.id,
          lifecycle_stage: 'volunteer',
          last_interaction_at: new Date().toISOString(),
          custom_fields: {
            volunteer_days: volunteer.days || [],
          },
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        throw createError;
      }

      contactId = newContact.id;
    }

    // Ensure "Volunteers" list exists
    let { data: volunteersList } = await supabaseClient
      .from('crm_lists')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', 'Volunteers')
      .maybeSingle();

    if (!volunteersList) {
      console.log('Creating Volunteers list');
      const { data: newList, error: listError } = await supabaseClient
        .from('crm_lists')
        .insert({
          organization_id: organizationId,
          name: 'Volunteers',
          description: 'Automatically populated from volunteer form submissions',
          list_type: 'dynamic',
          color: '#10b981',
          icon: 'users',
        })
        .select()
        .single();

      if (listError) {
        console.error('Error creating list:', listError);
      } else {
        volunteersList = newList;
      }
    }

    // Add contact to Volunteers list
    if (volunteersList) {
      const { error: membershipError } = await supabaseClient
        .from('crm_list_memberships')
        .upsert({
          list_id: volunteersList.id,
          contact_id: contactId,
        }, {
          onConflict: 'list_id,contact_id',
          ignoreDuplicates: true,
        });

      if (membershipError) {
        console.error('Error adding to list:', membershipError);
      }
    }

    // Log interaction
    const { error: interactionError } = await supabaseClient
      .from('crm_interactions')
      .insert({
        contact_id: contactId,
        organization_id: organizationId,
        interaction_type: 'form_submission',
        subject: 'Volunteer Application',
        description: `Volunteer form submitted via chatbot. Available days: ${volunteer.days?.join(', ') || 'Not specified'}`,
        source_module: 'chatbots',
        source_id: volunteer.id,
        interaction_date: new Date().toISOString(),
        metadata: {
          volunteer_days: volunteer.days || [],
        },
      });

    if (interactionError) {
      console.error('Error logging interaction:', interactionError);
    }

    console.log('Successfully synced volunteer to CRM');

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-volunteer-to-crm:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
