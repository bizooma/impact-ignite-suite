import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is platform admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('is_platform_admin')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.is_platform_admin) {
      throw new Error('Insufficient privileges');
    }

    const { action, targetUserId, data: actionData } = await req.json();

    let result;

    switch (action) {
      case 'platform_stats': {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

        // Total users + active sessions (paginate auth users)
        let totalUsers = 0;
        let usersLast30 = 0;
        let usersPrev30 = 0;
        let activeSessions = 0;
        let page = 1;
        const perPage = 1000;
        while (true) {
          const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage });
          if (error) throw error;
          const batch = data.users;
          totalUsers += batch.length;
          for (const u of batch) {
            if (u.created_at >= thirtyDaysAgo) usersLast30++;
            else if (u.created_at >= sixtyDaysAgo) usersPrev30++;
            if (u.last_sign_in_at && u.last_sign_in_at >= fifteenMinAgo) activeSessions++;
          }
          if (batch.length < perPage) break;
          page++;
        }

        // Organizations counts
        const { count: totalOrgs } = await supabaseClient
          .from('organizations')
          .select('*', { count: 'exact', head: true });
        const { count: orgsLast30 } = await supabaseClient
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', thirtyDaysAgo);
        const { count: orgsPrev30 } = await supabaseClient
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sixtyDaysAgo)
          .lt('created_at', thirtyDaysAgo);

        const pctChange = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return Math.round(((curr - prev) / prev) * 100);
        };

        result = {
          totalUsers,
          userGrowthPct: pctChange(usersLast30, usersPrev30),
          totalOrganizations: totalOrgs ?? 0,
          orgGrowthPct: pctChange(orgsLast30 ?? 0, orgsPrev30 ?? 0),
          activeSessions,
          systemHealth: 100,
        };
        console.log('platform_stats result:', JSON.stringify(result));
        break;
      }

      case 'feature_usage': {
        const tables = ['chatbots', 'qr_codes', 'social_posts', 'seo_audits'] as const;
        const counts: Record<string, number> = {};
        for (const t of tables) {
          const { count } = await supabaseClient.from(t).select('*', { count: 'exact', head: true });
          counts[t] = count ?? 0;
        }
        const max = Math.max(1, ...Object.values(counts));
        result = {
          features: [
            { name: 'Chatbots', count: counts.chatbots, percentage: Math.round((counts.chatbots / max) * 100) },
            { name: 'QR Codes', count: counts.qr_codes, percentage: Math.round((counts.qr_codes / max) * 100) },
            { name: 'Social Media', count: counts.social_posts, percentage: Math.round((counts.social_posts / max) * 100) },
            { name: 'SEO Audits', count: counts.seo_audits, percentage: Math.round((counts.seo_audits / max) * 100) },
          ],
        };
        break;
      }

      case 'user_growth': {
        // Last 6 months of new user signups
        const months: { label: string; count: number; start: Date; end: Date }[] = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          months.push({
            label: start.toLocaleString('en-US', { month: 'short' }),
            count: 0,
            start,
            end,
          });
        }
        let page = 1;
        const perPage = 1000;
        while (true) {
          const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage });
          if (error) throw error;
          for (const u of data.users) {
            const created = new Date(u.created_at);
            for (const m of months) {
              if (created >= m.start && created < m.end) { m.count++; break; }
            }
          }
          if (data.users.length < perPage) break;
          page++;
        }
        result = months.map(({ label, count }) => ({ month: label, users: count }));
        break;
      }

      case 'recent_activity': {
        const { data, error } = await supabaseClient
          .from('admin_audit_logs')
          .select('id, action, target_type, details, created_at')
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        result = data ?? [];
        break;
      }

      case 'list_users':
        // Fetch users from auth.users with profile data
        const { data: authUsers, error: listUsersError } = await supabaseClient.auth.admin.listUsers();
        
        if (listUsersError) throw listUsersError;

        // Get profile data for all users
        const userIds = authUsers.users.map(u => u.id);
        const { data: profiles, error: profilesError } = await supabaseClient
          .from('profiles')
          .select('user_id, display_name, is_platform_admin')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Get memberships for all users
        const { data: memberships, error: membershipsError } = await supabaseClient
          .from('memberships')
          .select(`
            user_id,
            role,
            organizations (
              id,
              name,
              slug
            )
          `)
          .in('user_id', userIds);

        if (membershipsError) throw membershipsError;

        // Combine all data
        result = authUsers.users.map(authUser => {
          const profile = profiles?.find(p => p.user_id === authUser.id);
          const userMemberships = memberships?.filter(m => m.user_id === authUser.id) || [];
          
          return {
            id: authUser.id,
            email: authUser.email,
            display_name: profile?.display_name || authUser.user_metadata?.display_name,
            is_platform_admin: profile?.is_platform_admin || false,
            created_at: authUser.created_at,
            last_sign_in_at: authUser.last_sign_in_at,
            organizations: userMemberships.map(m => ({
              id: (m.organizations as any)?.id,
              name: (m.organizations as any)?.name,
              slug: (m.organizations as any)?.slug,
              role: m.role
            }))
          };
        });

        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'list_users',
          target_type: 'system'
        });
        break;

      case 'grant_admin':
        result = await supabaseClient.rpc('grant_platform_admin', {
          _email: actionData.email
        });
        
        // Log the admin action
        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'grant_platform_admin',
          target_type: 'user',
          details: { target_email: actionData.email }
        });
        break;

      case 'suspend_user':
        // In a real implementation, you'd update user status
        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'suspend_user',
          target_type: 'user',
          target_id: targetUserId,
          details: actionData
        });
        result = { success: true };
        break;

      case 'view_user_details':
        // Fetch comprehensive user details
        const { data: userDetails, error: userError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .single();

        if (userError) throw userError;

        // Get user's organizations
        const { data: userMemberships, error: userMembershipsError } = await supabaseClient
          .from('memberships')
          .select(`
            role,
            organizations (
              id,
              name,
              slug
            )
          `)
          .eq('user_id', targetUserId);

        if (userMembershipsError) throw userMembershipsError;

        await supabaseClient.from('admin_audit_logs').insert({
          admin_user_id: user.id,
          action: 'view_user_details',
          target_type: 'user',
          target_id: targetUserId
        });

        result = {
          user: userDetails,
          organizations: userMemberships
        };
        break;

      default:
        throw new Error('Unknown action');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Admin action error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An error occurred processing admin action';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});