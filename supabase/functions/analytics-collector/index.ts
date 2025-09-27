import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYTICS-COLLECTOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Analytics collection started");

    const { organizationId, metricType, value, metadata } = await req.json();
    logStep("Collecting metric", { organizationId, metricType, value });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Store analytics data
    const { error: insertError } = await supabaseClient
      .from('analytics_data')
      .insert({
        organization_id: organizationId,
        metric_type: metricType,
        value: value,
        metadata: metadata || {},
        recorded_at: new Date().toISOString()
      });

    if (insertError) {
      logStep("Error storing analytics", { error: insertError });
      throw insertError;
    }

    // Aggregate daily stats
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existingStats } = await supabaseClient
      .from('daily_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('date', today)
      .eq('metric_type', metricType)
      .single();

    if (existingStats) {
      // Update existing daily stats
      const { error: updateError } = await supabaseClient
        .from('daily_analytics')
        .update({
          total_value: existingStats.total_value + value,
          event_count: existingStats.event_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      if (updateError) {
        logStep("Error updating daily stats", { error: updateError });
      }
    } else {
      // Create new daily stats record
      const { error: createError } = await supabaseClient
        .from('daily_analytics')
        .insert({
          organization_id: organizationId,
          date: today,
          metric_type: metricType,
          total_value: value,
          event_count: 1
        });

      if (createError) {
        logStep("Error creating daily stats", { error: createError });
      }
    }

    logStep("Analytics data stored successfully");

    return new Response(JSON.stringify({ 
      success: true,
      recorded: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in analytics-collector", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});