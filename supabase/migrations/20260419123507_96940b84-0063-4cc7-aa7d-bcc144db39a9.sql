DROP VIEW IF EXISTS public.org_ai_usage_current_period;

CREATE VIEW public.org_ai_usage_current_period
WITH (security_invoker = true) AS
SELECT
  organization_id,
  date_trunc('month', now()) AS period_start,
  COUNT(*) FILTER (WHERE event_type = 'chat_message') AS messages_count,
  COUNT(*) FILTER (WHERE event_type = 'chat_message' AND used_byo_key = false) AS messages_count_platform,
  COUNT(*) FILTER (WHERE event_type = 'chat_message' AND used_byo_key = true) AS messages_count_byo,
  COUNT(*) FILTER (WHERE event_type = 'embedding') AS embeddings_count,
  COALESCE(SUM(tokens_input), 0) AS tokens_input_total,
  COALESCE(SUM(tokens_output), 0) AS tokens_output_total
FROM public.ai_usage_events
WHERE created_at >= date_trunc('month', now())
GROUP BY organization_id;

GRANT SELECT ON public.org_ai_usage_current_period TO authenticated, service_role;