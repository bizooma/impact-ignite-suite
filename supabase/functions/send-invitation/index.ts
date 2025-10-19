import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InvitationRequest {
  organizationId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organizationId, email, role }: InvitationRequest = await req.json();

    // Validate inputs
    if (!organizationId || !email || !role) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin or owner of the organization
    const { data: membership } = await supabaseClient
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", organizationId)
      .single();

    if (!membership || (membership.role !== "admin" && membership.role !== "owner")) {
      return new Response(JSON.stringify({ error: "You must be an admin or owner to send invitations" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check current member count (maximum 5 total including owner)
    const { count: memberCount } = await supabaseClient
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    // Check pending invitations
    const { count: pendingInviteCount } = await supabaseClient
      .from("organization_invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "pending");

    const totalSlots = (memberCount || 0) + (pendingInviteCount || 0);
    if (totalSlots >= 5) {
      return new Response(JSON.stringify({ error: "Organization has reached the maximum of 5 team members" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Note: We don't check if email is already a member here
    // This check will happen during invitation acceptance

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabaseClient
      .from("organization_invitations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return new Response(JSON.stringify({ error: "An invitation for this email is already pending" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get organization details for email
    const { data: organization } = await supabaseClient
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    // Get inviter's name
    const { data: inviterProfile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    // Create invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from("organization_invitations")
      .insert({
        organization_id: organizationId,
        email,
        role,
        invited_by: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send invitation email
    const acceptUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || ""}/auth?invite=${invitation.token}`;
    
    const { error: emailError } = await resend.emails.send({
      from: "Causeio <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to join ${organization?.name || "an organization"} on Causeio`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">You've been invited!</h1>
          <p>Hi there,</p>
          <p><strong>${inviterProfile?.display_name || "Someone"}</strong> has invited you to join <strong>${organization?.name || "their organization"}</strong> on Causeio as a <strong>${role}</strong>.</p>
          <p>Causeio helps nonprofits manage their digital presence, engage with their community, and amplify their mission.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
          <p style="color: #666; font-size: 14px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">Causeio - Empowering nonprofits with compassionate technology</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the request if email fails, invitation is still created
    }

    console.log(`Invitation sent to ${email} for organization ${organizationId}`);

    return new Response(JSON.stringify({ success: true, invitation }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-invitation:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
