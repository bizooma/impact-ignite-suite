CREATE TABLE public.social_calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  show_awareness_days BOOLEAN NOT NULL DEFAULT true,
  enabled_categories TEXT[] NOT NULL DEFAULT ARRAY['health','social','environment','youth','arts','animals','giving','global']::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_calendar_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view calendar settings"
  ON public.social_calendar_settings
  FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage calendar settings"
  ON public.social_calendar_settings
  FOR ALL
  USING (
    public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  )
  WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, 'admin'::app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  );

CREATE TRIGGER update_social_calendar_settings_updated_at
  BEFORE UPDATE ON public.social_calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();