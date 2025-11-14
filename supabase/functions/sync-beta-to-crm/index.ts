import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BetaSignupData {
  id: string;
  name: string;
  email: string;
  organization?: string;
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

    const { betaSignup } = await req.json();

    if (!betaSignup) {
      throw new Error('Beta signup data is required');
    }

    console.log('Syncing beta signup to CRM:', betaSignup);

    // Sync to Bizooma organization
    const organizationId = 'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0';

    // Split name into first and last name
    const nameParts = betaSignup.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Check if contact already exists by email
    const { data: existingContact } = await supabaseClient
      .from('crm_contacts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('email', betaSignup.email)
      .maybeSingle();

    let contactId: string;

    if (existingContact) {
      // Update existing contact
      console.log('Updating existing contact:', existingContact.id);
      
      const updateData: any = {
        lifecycle_stage: 'lead',
        last_interaction_at: new Date().toISOString(),
      };

      if (betaSignup.organization) {
        updateData.custom_fields = {
          beta_organization: betaSignup.organization,
        };
      }

      const { data: updatedContact, error: updateError } = await supabaseClient
        .from('crm_contacts')
        .update(updateData)
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
      console.log('Creating new contact for beta signup');
      
      const insertData: any = {
        organization_id: organizationId,
        contact_type: 'individual',
        first_name: firstName,
        last_name: lastName,
        email: betaSignup.email,
        source: 'beta_signup',
        source_id: betaSignup.id,
        lifecycle_stage: 'lead',
        last_interaction_at: new Date().toISOString(),
      };

      if (betaSignup.organization) {
        insertData.custom_fields = {
          beta_organization: betaSignup.organization,
        };
      }

      const { data: newContact, error: createError } = await supabaseClient
        .from('crm_contacts')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        throw createError;
      }

      contactId = newContact.id;
    }

    // Ensure "Beta Testers" list exists
    let { data: betaList } = await supabaseClient
      .from('crm_lists')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', 'Beta Testers')
      .maybeSingle();

    if (!betaList) {
      console.log('Creating Beta Testers list');
      
      const { data: newList, error: listError } = await supabaseClient
        .from('crm_lists')
        .insert({
          organization_id: organizationId,
          name: 'Beta Testers',
          description: 'Contacts who signed up for beta testing',
          list_type: 'static',
          color: '#8B5CF6',
          icon: 'Sparkles',
        })
        .select()
        .single();

      if (listError) {
        console.error('Error creating Beta Testers list:', listError);
        throw listError;
      }

      betaList = newList;
    }

    // Add contact to Beta Testers list (if not already added)
    if (betaList) {
      const { data: existingMembership } = await supabaseClient
        .from('crm_list_memberships')
        .select('id')
        .eq('list_id', betaList.id)
        .eq('contact_id', contactId)
        .maybeSingle();

      if (!existingMembership) {
        console.log('Adding contact to Beta Testers list');
        
        const { error: membershipError } = await supabaseClient
          .from('crm_list_memberships')
          .insert({
            list_id: betaList.id,
            contact_id: contactId,
          });

        if (membershipError) {
          console.error('Error adding to list:', membershipError);
          throw membershipError;
        }
      }
    }

    // Log interaction
    console.log('Logging beta signup interaction');
    
    const { error: interactionError } = await supabaseClient
      .from('crm_interactions')
      .insert({
        contact_id: contactId,
        organization_id: organizationId,
        interaction_type: 'form_submission',
        subject: 'Beta Program Signup',
        description: `Signed up for beta testing program${betaSignup.organization ? ` representing ${betaSignup.organization}` : ''}`,
        interaction_date: new Date().toISOString(),
        source_module: 'beta_signup',
        source_id: betaSignup.id,
      });

    if (interactionError) {
      console.error('Error logging interaction:', interactionError);
      // Don't throw, interaction logging is not critical
    }

    console.log('Successfully synced beta signup to CRM');

    return new Response(
      JSON.stringify({ success: true, contactId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in sync-beta-to-crm:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
