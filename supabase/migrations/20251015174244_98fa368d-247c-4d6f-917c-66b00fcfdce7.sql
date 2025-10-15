-- Phase 1: Database Schema Updates for Mobile App Management

-- 1.1 Create mobile_app_databases table
CREATE TABLE public.mobile_app_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organization_code TEXT UNIQUE NOT NULL,
  database_name TEXT NOT NULL,
  supabase_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(organization_id, organization_code)
);

-- Enable RLS
ALTER TABLE public.mobile_app_databases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mobile_app_databases
CREATE POLICY "Org admins can manage mobile app databases"
  ON public.mobile_app_databases
  FOR ALL
  USING (
    has_org_role(auth.uid(), organization_id, 'admin'::app_role) 
    OR has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  );

CREATE POLICY "Org members can view mobile app databases"
  ON public.mobile_app_databases
  FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

-- Add trigger for updated_at
CREATE TRIGGER update_mobile_app_databases_updated_at
  BEFORE UPDATE ON public.mobile_app_databases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.2 Update organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS mobile_app_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS has_mobile_app BOOLEAN DEFAULT false;

-- 1.3 Create audit logging table for mobile app operations
CREATE TABLE public.mobile_app_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  operation_type TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.mobile_app_audit_logs ENABLE ROW LEVEL SECURITY;

-- Org admins can view audit logs
CREATE POLICY "Org admins can view mobile app audit logs"
  ON public.mobile_app_audit_logs
  FOR SELECT
  USING (
    has_org_role(auth.uid(), organization_id, 'admin'::app_role) 
    OR has_org_role(auth.uid(), organization_id, 'owner'::app_role)
  );

-- System can insert audit logs
CREATE POLICY "System can insert mobile app audit logs"
  ON public.mobile_app_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_mobile_app_audit_logs_org_id ON public.mobile_app_audit_logs(organization_id);
CREATE INDEX idx_mobile_app_audit_logs_created_at ON public.mobile_app_audit_logs(created_at DESC);
CREATE INDEX idx_mobile_app_databases_org_code ON public.mobile_app_databases(organization_code);
CREATE INDEX idx_organizations_mobile_app_code ON public.organizations(mobile_app_code) WHERE mobile_app_code IS NOT NULL;