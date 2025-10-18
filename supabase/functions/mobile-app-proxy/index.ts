import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: userId -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

interface ProxyRequest {
  operation: 'select' | 'insert' | 'update' | 'delete' | 'count' | 'upsert' | 'create_user_with_hash';
  table: string;
  data?: any;
  filters?: Record<string, any>;
  columns?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  organizationId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client for main platform database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Rate limiting check
    const now = Date.now();
    const userLimit = rateLimitMap.get(user.id);
    
    if (userLimit) {
      if (now < userLimit.resetAt) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        userLimit.count++;
      } else {
        rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    }

    // Clean up old entries (every 100 requests)
    if (Math.random() < 0.01) {
      for (const [userId, limit] of rateLimitMap.entries()) {
        if (now > limit.resetAt) {
          rateLimitMap.delete(userId);
        }
      }
    }

    // Parse request body
    const body: ProxyRequest = await req.json();
    const { operation, table, data, filters, columns, orderBy, limit, offset, organizationId } = body;

    console.log('Mobile app proxy request:', { userId: user.id, organizationId, operation, table });

    // Verify user has admin role for the Causeio organization
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      throw new Error('Failed to verify permissions');
    }

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      console.warn('Unauthorized access attempt:', { 
        userId: user.id, 
        organizationId, 
        role: membership?.role 
      });
      throw new Error('Access denied: Administrator privileges required for this organization');
    }

    // Get mobile app database configuration
    const { data: dbConfig, error: configError } = await supabase
      .from('mobile_app_databases')
      .select('organization_code, supabase_url, is_active')
      .eq('organization_id', organizationId)
      .single();

    if (configError || !dbConfig) {
      throw new Error('Mobile app database not configured for this organization');
    }

    if (!dbConfig.is_active) {
      throw new Error('Mobile app database is currently inactive');
    }

    // Get credentials from secrets
    const orgCode = dbConfig.organization_code;
    const mobileDbUrl = Deno.env.get(`MOBILE_DB_${orgCode}_URL`);
    const mobileDbKey = Deno.env.get(`MOBILE_DB_${orgCode}_SERVICE_KEY`);

    if (!mobileDbUrl || !mobileDbKey) {
      throw new Error('Mobile app database credentials not found. Please contact support.');
    }

    // Create client for external mobile app database
    const mobileClient = createClient(mobileDbUrl, mobileDbKey, {
      auth: { persistSession: false }
    });

    // Execute the requested operation
    let query: any;
    let result: any;

    switch (operation) {
      case 'select': {
        query = mobileClient.from(table).select(columns || '*');
        
        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // Handle complex filters like { operator: 'gt', value: 10 }
              const { operator, value: filterValue } = value as any;
              query = query[operator](key, filterValue);
            } else {
              query = query.eq(key, value);
            }
          });
        }

        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        // Apply pagination
        if (limit !== undefined) {
          query = query.limit(limit);
        }
        if (offset !== undefined) {
          query = query.range(offset, offset + (limit || 10) - 1);
        }

        result = await query;
        break;
      }

      case 'insert': {
        result = await mobileClient.from(table).insert(data).select();
        break;
      }

      case 'update': {
        // Filter update fields for known-safe columns in mobile DB
        let updatePayload = data;
        if (table === 'users' && data && typeof data === 'object') {
          const allowed = ['full_name', 'username', 'role', 'is_active'] as const;
          updatePayload = Object.fromEntries(
            Object.entries(data).filter(([k]) => (allowed as readonly string[]).includes(k))
          );
        }

        query = mobileClient.from(table).update(updatePayload);
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        result = await query.select();
        break;
      }

      case 'delete': {
        query = mobileClient.from(table).delete();
        
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        
        result = await query.select();
        break;
      }

      case 'upsert': {
        result = await mobileClient.from(table).upsert(data).select();
        break;
      }

      case 'count': {
        result = await mobileClient.from(table).select('*', { count: 'exact', head: true });
        break;
      }

      case 'create_user_with_hash': {
        // Secure user creation with password hashing
        if (!data.password) {
          throw new Error('Password is required');
        }

        // Input validation
        if (data.username && typeof data.username === 'string') {
          data.username = data.username.trim();
          if (data.username.length < 3 || data.username.length > 50) {
            throw new Error('Username must be between 3 and 50 characters');
          }
        }

        if (data.full_name && typeof data.full_name === 'string') {
          data.full_name = data.full_name.trim();
          if (data.full_name.length > 100) {
            throw new Error('Full name must be less than 100 characters');
          }
        }

        // Hash password with bcryptjs (edge-compatible)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.password, salt);
        
        // Whitelist payload to columns known to exist in RanchVoice DB
        const allowedBase = ['full_name', 'username', 'role', 'is_active'] as const;
        const basePayload = Object.fromEntries(
          Object.entries(data || {}).filter(([k]) => (allowedBase as readonly string[]).includes(k))
        );

        // Create user with hashed password
        const insertPayload = {
          ...basePayload,
          password_hash: passwordHash,
        } as Record<string, any>;

        result = await mobileClient.from(table).insert(insertPayload).select();
        break;
      }

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // Check for errors
    if (result.error) {
      throw result.error;
    }

    // Log the operation to audit logs with detailed information
    const auditLogData = {
      organization_id: organizationId,
      user_id: user.id,
      action: `mobile_app_${operation}`,
      table_name: table,
      operation_type: operation,
      details: {
        filters,
        columns,
        recordsAffected: Array.isArray(result.data) ? result.data.length : result.count || 0,
        ...(operation === 'update' && data ? { changes: Object.keys(data) } : {}),
        ...(operation === 'delete' ? { deletedRecords: result.data?.length || 0 } : {}),
      },
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: req.headers.get('user-agent')
    };

    const { error: auditError } = await supabase
      .from('mobile_app_audit_logs')
      .insert(auditLogData);

    if (auditError) {
      console.error('Failed to log audit:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Update last_synced_at timestamp
    await supabase
      .from('mobile_app_databases')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('organization_id', organizationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        count: result.count
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Mobile app proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
