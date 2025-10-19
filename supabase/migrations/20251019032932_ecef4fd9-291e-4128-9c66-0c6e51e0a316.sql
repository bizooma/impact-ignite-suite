-- Create organization invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL CHECK (role != 'owner'),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email, status)
);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organization members can view invitations"
  ON public.organization_invitations
  FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Organization admins can create invitations"
  ON public.organization_invitations
  FOR INSERT
  WITH CHECK (
    (has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'owner'))
    AND role != 'owner'
  );

CREATE POLICY "Organization admins can update invitations"
  ON public.organization_invitations
  FOR UPDATE
  USING (has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'owner'));

CREATE POLICY "Organization admins can delete invitations"
  ON public.organization_invitations
  FOR DELETE
  USING (has_org_role(auth.uid(), organization_id, 'admin') OR has_org_role(auth.uid(), organization_id, 'owner'));

-- Add trigger for updated_at
CREATE TRIGGER update_organization_invitations_updated_at
  BEFORE UPDATE ON public.organization_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();