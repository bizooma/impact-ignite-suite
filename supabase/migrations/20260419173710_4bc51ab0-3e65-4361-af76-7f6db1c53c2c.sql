ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS is_beta_org boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_signup_id uuid REFERENCES public.beta_signups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_is_beta_org ON public.organizations(is_beta_org) WHERE is_beta_org = true;