
CREATE TYPE public.grant_stage AS ENUM ('researching', 'loi', 'proposal_drafting', 'submitted', 'awarded', 'declined', 'reporting', 'closed');

CREATE TABLE public.crm_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  foundation_name TEXT NOT NULL,
  grant_name TEXT NOT NULL,
  amount_requested NUMERIC,
  amount_awarded NUMERIC,
  stage public.grant_stage NOT NULL DEFAULT 'researching',
  deadline DATE,
  submitted_date DATE,
  decision_date DATE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  owner_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_grants_org ON public.crm_grants(organization_id);
CREATE INDEX idx_crm_grants_stage ON public.crm_grants(stage);
CREATE INDEX idx_crm_grants_deadline ON public.crm_grants(deadline);

ALTER TABLE public.crm_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view grants"
ON public.crm_grants FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Org admins can manage grants"
ON public.crm_grants FOR ALL
USING (organization_id IN (
  SELECT organization_id FROM public.memberships
  WHERE user_id = auth.uid() AND role = ANY (ARRAY['admin'::app_role, 'owner'::app_role])
));

CREATE TRIGGER update_crm_grants_updated_at
BEFORE UPDATE ON public.crm_grants
FOR EACH ROW
EXECUTE FUNCTION public.update_crm_updated_at_column();
