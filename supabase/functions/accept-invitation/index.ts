import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { token } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ error: "Invitation token is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("organization_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: "Invalid or expired invitation" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseClient
        .from("organization_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({ error: "This invitation has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      // User needs to sign in or sign up
      return new Response(JSON.stringify({ 
        requiresAuth: true,
        email: invitation.email,
        organizationId: invitation.organization_id,
        role: invitation.role
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the authenticated user's email matches the invitation
    if (user.email !== invitation.email) {
      return new Response(JSON.stringify({ 
        error: `This invitation is for ${invitation.email}. Please sign in with that email address.` 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is already a member
    const { data: existingMembership } = await supabaseClient
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("organization_id", invitation.organization_id)
      .maybeSingle();

    if (existingMembership) {
      // Mark invitation as accepted anyway
      await supabaseClient
        .from("organization_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({ 
        error: "You are already a member of this organization" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add user to organization
    const { error: membershipError } = await supabaseClient
      .from("memberships")
      .insert({
        user_id: user.id,
        organization_id: invitation.organization_id,
        role: invitation.role,
      });

    if (membershipError) {
      console.error("Error creating membership:", membershipError);
      return new Response(JSON.stringify({ error: "Failed to add you to the organization" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invitation as accepted
    await supabaseClient
      .from("organization_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    console.log(`User ${user.id} accepted invitation to organization ${invitation.organization_id}`);

    return new Response(JSON.stringify({ 
      success: true,
      organizationId: invitation.organization_id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in accept-invitation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
