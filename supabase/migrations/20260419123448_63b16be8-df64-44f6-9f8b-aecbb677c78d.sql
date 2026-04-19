ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  chatbot_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('chat_message', 'embedding')),
  model text,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  used_byo_key boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_org_created
  ON public.ai_usage_events (organization_id, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view ai usage"
  ON public.ai_usage_events
  FOR SELECT
  USING (
    has_org_role(auth.uid(), organization_id, 'admin'::app_role)
    OR has_org_role(auth.uid(), organization_id, 'owner'::app_role)
    OR is_platform_admin(auth.uid())
  );

CREATE TABLE IF NOT EXISTS public.org_ai_usage_overrides (
  organization_id uuid PRIMARY KEY,
  monthly_message_cap integer NOT NULL,
  override_reason text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_ai_usage_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their override"
  ON public.org_ai_usage_overrides
  FOR SELECT
  USING (
    is_org_member(auth.uid(), organization_id)
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Platform admins can manage overrides"
  ON public.org_ai_usage_overrides
  FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

DROP TRIGGER IF EXISTS set_org_ai_usage_overrides_updated_at ON public.org_ai_usage_overrides;
CREATE TRIGGER set_org_ai_usage_overrides_updated_at
  BEFORE UPDATE ON public.org_ai_usage_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE VIEW public.org_ai_usage_current_period AS
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