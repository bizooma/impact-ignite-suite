import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map product IDs to tier names
const PRODUCT_TIERS: Record<string, string> = {
  "prod_T82VsvWMfdsfL0": "starter", // legacy $49.95
  "prod_T82V75NVjbGJYs": "professional", // legacy $99.95
  "prod_T82WHmDU15GAJi": "enterprise", // legacy $199
  "prod_UMhmmlTGrdiwoC": "starter", // $149
  "prod_UMhnb7QjgdDeqA": "professional", // $349
  "prod_UMhnzsjVPZBzZB": "enterprise", // $549
  "prod_UMij41tBZvb2nm": "starter", // beta $59
  "prod_UMij36M9v1d4wB": "professional", // beta $139
  "prod_UMikVVq2T12jYy": "enterprise", // beta $219
};

// Tier → product bundle. Keep in sync with src/lib/aiTierLimits.ts TIER_PRODUCT_BUNDLES.
const TIER_BUNDLES: Record<string, string[]> = {
  free: ['qr_codes', 'seo_audits', 'accessibility', 'tasks'],
  starter: ['qr_codes', 'seo_audits', 'accessibility', 'tasks', 'chatbots', 'social_media', 'crm'],
  professional: ['qr_codes', 'seo_audits', 'accessibility', 'tasks', 'chatbots', 'social_media', 'crm', 'analytics'],
  enterprise: [
    'qr_codes', 'seo_audits', 'accessibility', 'tasks', 'chatbots',
    'social_media', 'crm', 'analytics', 'campaigns', 'google_business', 'mobile_app',
  ],
};

// Every product that appears in ANY tier bundle. Anything in an org's
// `purchased_products` that is NOT in this set is treated as a manual
// platform-admin grant and preserved across subscription syncs.
const MANAGED_PRODUCTS: Set<string> = new Set(
  Object.values(TIER_BUNDLES).flat()
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use anon key for auth verification, service role for org updates
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    let hasActiveSub = false;
    let productId: string | null = null;
    let tier: string = "free";
    let subscriptionEnd: string | null = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      logStep("Found Stripe customer", { customerId });

      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      hasActiveSub = subscriptions.data.length > 0;

      if (hasActiveSub) {
        const subscription = subscriptions.data[0];
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        productId = subscription.items.data[0].price.product as string;
        tier = PRODUCT_TIERS[productId] || "free";
        logStep("Active subscription", { productId, tier });
      } else {
        logStep("No active subscription — defaulting to free");
      }
    } else {
      logStep("No Stripe customer — defaulting to free");
    }

    // Sync tier + product bundle to all orgs the user owns.
    // NOTE: this OVERWRITES purchased_products with the tier bundle. Manual
    // platform-admin overrides will be reset. Adjust the user's tier instead.
    const { data: ownerOrgs, error: orgErr } = await supabaseAdmin
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('role', 'owner');

    if (orgErr) {
      logStep("Error fetching owner orgs (non-fatal)", { error: orgErr.message });
    } else if (ownerOrgs && ownerOrgs.length > 0) {
      const bundle = TIER_BUNDLES[tier] || TIER_BUNDLES.free;
      const orgIds = ownerOrgs.map((m: any) => m.organization_id);
      const { error: updateErr } = await supabaseAdmin
        .from('organizations')
        .update({ subscription_tier: tier, purchased_products: bundle })
        .in('id', orgIds);
      if (updateErr) {
        logStep("Error updating orgs (non-fatal)", { error: updateErr.message });
      } else {
        logStep("Synced tier + bundle to orgs", { orgIds, tier, bundle });
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      productId,
      subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
