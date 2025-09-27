import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GBP-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("GBP sync function started");

    const { profileId } = await req.json();
    logStep("Processing sync", { profileId });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('gbp_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      logStep("Profile not found", { error: profileError });
      throw new Error("Profile not found");
    }

    logStep("Profile found", { businessName: profile.business_name });

    // Simulate Google Business Profile API sync
    // In a real implementation, this would use the Google My Business API
    const syncResults = await simulateGbpSync(profile);
    
    // Update profile with sync results
    const { error: updateError } = await supabaseClient
      .from('gbp_profiles')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_status: 'success',
        ...syncResults
      })
      .eq('id', profileId);

    if (updateError) {
      logStep("Error updating profile", { error: updateError });
      throw updateError;
    }

    // Generate optimization tasks based on profile data
    const tasks = generateOptimizationTasks(profile, syncResults);
    
    if (tasks.length > 0) {
      const { error: tasksError } = await supabaseClient
        .from('gbp_tasks')
        .insert(tasks);

      if (tasksError) {
        logStep("Error creating tasks", { error: tasksError });
      }
    }

    logStep("Sync completed successfully", { tasksGenerated: tasks.length });

    return new Response(JSON.stringify({ 
      success: true,
      syncResults,
      tasksGenerated: tasks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in gbp-sync", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function simulateGbpSync(profile: any) {
  // Simulate API response delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate fetched data from Google Business Profile
  return {
    reviews_count: Math.floor(Math.random() * 100) + 10,
    average_rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 - 5.0
    total_views: Math.floor(Math.random() * 1000) + 100,
    search_views: Math.floor(Math.random() * 500) + 50,
    maps_views: Math.floor(Math.random() * 500) + 50,
    phone_calls: Math.floor(Math.random() * 50) + 5,
    direction_requests: Math.floor(Math.random() * 100) + 10,
    website_clicks: Math.floor(Math.random() * 75) + 15,
  };
}

function generateOptimizationTasks(profile: any, syncResults: any) {
  const tasks = [];
  
  // Task suggestions based on profile data
  if (!profile.description || profile.description.length < 50) {
    tasks.push({
      gbp_profile_id: profile.id,
      title: 'Improve Business Description',
      description: 'Write a compelling business description (150+ characters) that includes relevant keywords and highlights your unique value proposition.',
      task_type: 'content_optimization',
      priority: 8,
      status: 'pending'
    });
  }
  
  if (!profile.categories || profile.categories.length < 3) {
    tasks.push({
      gbp_profile_id: profile.id,
      title: 'Add More Business Categories',
      description: 'Select additional relevant business categories to improve discoverability. Aim for 3-5 accurate categories.',
      task_type: 'profile_optimization',
      priority: 7,
      status: 'pending'
    });
  }
  
  if (syncResults.reviews_count < 10) {
    tasks.push({
      gbp_profile_id: profile.id,
      title: 'Request Customer Reviews', 
      description: 'Encourage satisfied customers to leave reviews. Send follow-up emails or texts with direct review links.',
      task_type: 'review_management',
      priority: 9,
      status: 'pending'
    });
  }
  
  if (syncResults.average_rating < 4.0) {
    tasks.push({
      gbp_profile_id: profile.id,
      title: 'Address Customer Feedback',
      description: 'Review recent feedback and address any recurring issues to improve customer satisfaction and ratings.',
      task_type: 'review_management', 
      priority: 10,
      status: 'pending'
    });
  }
  
  return tasks;
}