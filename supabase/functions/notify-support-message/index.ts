import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-secret',
}

function jsonResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const notifySecret = Deno.env.get('SUPPORT_NOTIFY_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const recipientEmail = Deno.env.get('SUPPORT_NOTIFY_EMAIL')

  if (!notifySecret || !supabaseUrl || !supabaseServiceKey || !recipientEmail) {
    console.error('Missing required environment variables')
    return jsonResponse({ error: 'Server configuration error' }, 500)
  }

  // Validate shared-secret header (set by the DB trigger)
  const provided = req.headers.get('x-notify-secret')
  if (provided !== notifySecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let payload: {
    thread_id?: string
    message_id?: string
    sender_role?: string
    organization_id?: string
    content?: string
  }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  // Skip admin/support replies
  if (payload.sender_role === 'support') {
    return jsonResponse({ skipped: true, reason: 'sender_is_support' })
  }
  if (!payload.message_id || !payload.organization_id) {
    return jsonResponse({ error: 'Missing message_id or organization_id' }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Look up org name + sender info
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', payload.organization_id)
    .maybeSingle()

  let senderName: string | undefined
  let senderEmail: string | undefined
  if (payload.thread_id) {
    const { data: thread } = await supabase
      .from('support_threads')
      .select('user_id')
      .eq('id', payload.thread_id)
      .maybeSingle()
    if (thread?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', thread.user_id)
        .maybeSingle()
      senderName = profile?.display_name ?? undefined
      const { data: authUser } = await supabase.auth.admin.getUserById(
        thread.user_id,
      )
      senderEmail = authUser?.user?.email ?? undefined
    }
  }

  const orgName = org?.name || 'an organization'
  const preview = (payload.content || '').slice(0, 240)

  // Invoke send-transactional-email (uses the queue + idempotency)
  const { error: invokeError } = await supabase.functions.invoke(
    'send-transactional-email',
    {
      body: {
        templateName: 'new-support-message',
        recipientEmail,
        idempotencyKey: `support-msg-${payload.message_id}`,
        templateData: {
          orgName,
          senderName,
          senderEmail,
          messagePreview: preview,
        },
      },
    },
  )

  if (invokeError) {
    console.error('Failed to invoke send-transactional-email', invokeError)
    return jsonResponse({ error: 'Failed to enqueue email' }, 500)
  }

  return jsonResponse({ success: true })
})
