-- Create table for CRM to Mailchimp list mappings
CREATE TABLE IF NOT EXISTS public.crm_mailchimp_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  crm_list_id UUID NOT NULL REFERENCES public.crm_lists(id) ON DELETE CASCADE,
  mailchimp_audience_id TEXT NOT NULL,
  field_mappings JSONB DEFAULT '{
    "first_name": "FNAME",
    "last_name": "LNAME",
    "email": "EMAIL",
    "phone": "PHONE",
    "organization_name": "COMPANY"
  }'::jsonb,
  sync_enabled BOOLEAN DEFAULT false,
  sync_frequency TEXT DEFAULT 'manual' CHECK (sync_frequency IN ('manual', 'hourly', 'daily', 'weekly')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_sync_error TEXT,
  sync_options JSONB DEFAULT '{
    "double_optin": false,
    "update_existing": true,
    "archive_on_removal": false,
    "sync_tags": true,
    "sync_direction": "one_way"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(crm_list_id, mailchimp_audience_id)
);

-- Create table for sync logs
CREATE TABLE IF NOT EXISTS public.crm_mailchimp_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapping_id UUID NOT NULL REFERENCES public.crm_mailchimp_mappings(id) ON DELETE CASCADE,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  contacts_processed INTEGER DEFAULT 0,
  contacts_added INTEGER DEFAULT 0,
  contacts_updated INTEGER DEFAULT 0,
  contacts_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'partial', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_mailchimp_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mailchimp_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for mappings
CREATE POLICY "Org admins can manage mailchimp mappings"
  ON public.crm_mailchimp_mappings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Org members can view mailchimp mappings"
  ON public.crm_mailchimp_mappings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- RLS policies for sync logs
CREATE POLICY "Org admins can view mailchimp sync logs"
  ON public.crm_mailchimp_sync_logs
  FOR SELECT
  USING (
    mapping_id IN (
      SELECT id FROM public.crm_mailchimp_mappings
      WHERE organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

CREATE POLICY "System can insert sync logs"
  ON public.crm_mailchimp_sync_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sync logs"
  ON public.crm_mailchimp_sync_logs
  FOR UPDATE
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_crm_mailchimp_mappings_updated_at
  BEFORE UPDATE ON public.crm_mailchimp_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_crm_mailchimp_mappings_org_id ON public.crm_mailchimp_mappings(organization_id);
CREATE INDEX idx_crm_mailchimp_mappings_list_id ON public.crm_mailchimp_mappings(crm_list_id);
CREATE INDEX idx_crm_mailchimp_sync_logs_mapping_id ON public.crm_mailchimp_sync_logs(mapping_id);
CREATE INDEX idx_crm_mailchimp_sync_logs_status ON public.crm_mailchimp_sync_logs(status);