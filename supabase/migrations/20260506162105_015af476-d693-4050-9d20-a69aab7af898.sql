
-- Enums
CREATE TYPE public.accessnotify_campaign_type AS ENUM (
  'event_reminder','donation_reminder','volunteer_shift','program_update',
  'membership_renewal','library_overdue','library_hold','emergency_alert'
);

CREATE TYPE public.accessnotify_campaign_status AS ENUM (
  'draft','scheduled','sending','sent','failed'
);

CREATE TYPE public.accessnotify_channel AS ENUM ('email','sms','voice');

CREATE TYPE public.accessnotify_delivery_status AS ENUM (
  'pending','sent','delivered','failed','skipped'
);

CREATE TYPE public.accessnotify_check_status AS ENUM ('pass','warning','needs_review');

CREATE TYPE public.accessnotify_preferred_method AS ENUM ('email','sms','voice','multiple');

CREATE TYPE public.accessnotify_accommodation_status AS ENUM ('new','in_review','resolved');

-- Campaigns
CREATE TABLE public.accessnotify_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  type public.accessnotify_campaign_type NOT NULL DEFAULT 'program_update',
  status public.accessnotify_campaign_status NOT NULL DEFAULT 'draft',
  audience_list_id uuid,
  channels public.accessnotify_channel[] NOT NULL DEFAULT ARRAY['email']::public.accessnotify_channel[],
  subject text,
  email_body text,
  sms_body text,
  voice_script text,
  plain_language_body text,
  cta_url text,
  internal_notes text,
  send_at timestamptz,
  reminder_offset_minutes integer,
  accessibility_acknowledged boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessnotify_campaigns_org ON public.accessnotify_campaigns(organization_id);

-- Templates
CREATE TABLE public.accessnotify_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  category text NOT NULL,
  name text NOT NULL,
  subject text,
  email_body text,
  sms_body text,
  voice_script text,
  plain_language_body text,
  is_starter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessnotify_templates_org ON public.accessnotify_templates(organization_id);

-- Messages
CREATE TABLE public.accessnotify_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.accessnotify_campaigns(id) ON DELETE CASCADE,
  contact_id uuid,
  recipient_email text,
  recipient_phone text,
  channel public.accessnotify_channel NOT NULL,
  body_version text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessnotify_messages_org ON public.accessnotify_messages(organization_id);
CREATE INDEX idx_accessnotify_messages_campaign ON public.accessnotify_messages(campaign_id);

-- Deliveries
CREATE TABLE public.accessnotify_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  message_id uuid REFERENCES public.accessnotify_messages(id) ON DELETE CASCADE,
  channel public.accessnotify_channel NOT NULL,
  status public.accessnotify_delivery_status NOT NULL DEFAULT 'pending',
  provider_id text,
  error text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);
CREATE INDEX idx_accessnotify_deliveries_org ON public.accessnotify_deliveries(organization_id);

-- Preferences
CREATE TABLE public.accessnotify_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  preferred_method public.accessnotify_preferred_method NOT NULL DEFAULT 'email',
  large_text boolean NOT NULL DEFAULT false,
  simplified_language boolean NOT NULL DEFAULT false,
  voice_first boolean NOT NULL DEFAULT false,
  preferred_language text NOT NULL DEFAULT 'en',
  do_not_call boolean NOT NULL DEFAULT false,
  do_not_text boolean NOT NULL DEFAULT false,
  accommodation_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, contact_id)
);

-- Accessibility checks
CREATE TABLE public.accessnotify_accessibility_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.accessnotify_campaigns(id) ON DELETE CASCADE,
  check_key text NOT NULL,
  status public.accessnotify_check_status NOT NULL,
  detail text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

-- Compliance logs
CREATE TABLE public.accessnotify_compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  campaign_id uuid,
  campaign_name text,
  message_id uuid,
  recipient_label text,
  channel public.accessnotify_channel NOT NULL,
  delivery_status public.accessnotify_delivery_status NOT NULL,
  accessibility_score integer,
  template_id uuid,
  sent_by uuid,
  accommodation_applied jsonb,
  version_sent text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessnotify_logs_org_sent ON public.accessnotify_compliance_logs(organization_id, sent_at DESC);

-- Accommodation requests
CREATE TABLE public.accessnotify_accommodation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contact_id uuid,
  contact_name text NOT NULL,
  request_type text,
  preferred_accommodation text,
  notes text,
  status public.accessnotify_accommodation_status NOT NULL DEFAULT 'new',
  assigned_to uuid,
  received_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Settings
CREATE TABLE public.accessnotify_settings (
  organization_id uuid PRIMARY KEY,
  default_from_email text,
  default_sms_number text,
  default_voice_caller_id text,
  accessibility_statement_url text,
  accommodation_contact_email text,
  default_language text NOT NULL DEFAULT 'en',
  require_approval boolean NOT NULL DEFAULT false,
  channels_enabled jsonb NOT NULL DEFAULT '{"email":true,"sms":true,"voice":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at triggers
CREATE TRIGGER trg_accessnotify_campaigns_updated BEFORE UPDATE ON public.accessnotify_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_accessnotify_templates_updated BEFORE UPDATE ON public.accessnotify_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_accessnotify_preferences_updated BEFORE UPDATE ON public.accessnotify_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_accessnotify_accommodation_updated BEFORE UPDATE ON public.accessnotify_accommodation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_accessnotify_settings_updated BEFORE UPDATE ON public.accessnotify_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.accessnotify_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_accessibility_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_accommodation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessnotify_settings ENABLE ROW LEVEL SECURITY;

-- Helper macro: standard org-scoped policies
-- Campaigns
CREATE POLICY "campaigns_select" ON public.accessnotify_campaigns FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "campaigns_insert" ON public.accessnotify_campaigns FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);
CREATE POLICY "campaigns_update" ON public.accessnotify_campaigns FOR UPDATE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);
CREATE POLICY "campaigns_delete" ON public.accessnotify_campaigns FOR DELETE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin')
);

-- Templates (starter templates with NULL org are visible to everyone signed in)
CREATE POLICY "templates_select" ON public.accessnotify_templates FOR SELECT USING (
  organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id)
);
CREATE POLICY "templates_insert" ON public.accessnotify_templates FOR INSERT WITH CHECK (
  organization_id IS NOT NULL AND (
    public.has_org_role(auth.uid(), organization_id, 'owner') OR
    public.has_org_role(auth.uid(), organization_id, 'admin') OR
    public.has_org_role(auth.uid(), organization_id, 'editor')
  )
);
CREATE POLICY "templates_update" ON public.accessnotify_templates FOR UPDATE USING (
  organization_id IS NOT NULL AND (
    public.has_org_role(auth.uid(), organization_id, 'owner') OR
    public.has_org_role(auth.uid(), organization_id, 'admin') OR
    public.has_org_role(auth.uid(), organization_id, 'editor')
  )
);
CREATE POLICY "templates_delete" ON public.accessnotify_templates FOR DELETE USING (
  organization_id IS NOT NULL AND (
    public.has_org_role(auth.uid(), organization_id, 'owner') OR
    public.has_org_role(auth.uid(), organization_id, 'admin')
  )
);

-- Messages
CREATE POLICY "messages_select" ON public.accessnotify_messages FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "messages_insert" ON public.accessnotify_messages FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- Deliveries
CREATE POLICY "deliveries_select" ON public.accessnotify_deliveries FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "deliveries_insert" ON public.accessnotify_deliveries FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- Preferences
CREATE POLICY "prefs_select" ON public.accessnotify_preferences FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "prefs_insert" ON public.accessnotify_preferences FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);
CREATE POLICY "prefs_update" ON public.accessnotify_preferences FOR UPDATE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);
CREATE POLICY "prefs_delete" ON public.accessnotify_preferences FOR DELETE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin')
);

-- Accessibility checks
CREATE POLICY "checks_select" ON public.accessnotify_accessibility_checks FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "checks_insert" ON public.accessnotify_accessibility_checks FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- Compliance logs
CREATE POLICY "logs_select" ON public.accessnotify_compliance_logs FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "logs_insert" ON public.accessnotify_compliance_logs FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  public.has_org_role(auth.uid(), organization_id, 'editor')
);

-- Accommodation requests
CREATE POLICY "accomm_select" ON public.accessnotify_accommodation_requests FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "accomm_insert" ON public.accessnotify_accommodation_requests FOR INSERT WITH CHECK (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "accomm_update" ON public.accessnotify_accommodation_requests FOR UPDATE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin') OR
  assigned_to = auth.uid()
);
CREATE POLICY "accomm_delete" ON public.accessnotify_accommodation_requests FOR DELETE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin')
);

-- Settings
CREATE POLICY "settings_select" ON public.accessnotify_settings FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "settings_insert" ON public.accessnotify_settings FOR INSERT WITH CHECK (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin')
);
CREATE POLICY "settings_update" ON public.accessnotify_settings FOR UPDATE USING (
  public.has_org_role(auth.uid(), organization_id, 'owner') OR
  public.has_org_role(auth.uid(), organization_id, 'admin')
);

-- Seed starter templates (global)
INSERT INTO public.accessnotify_templates (organization_id, category, name, subject, email_body, sms_body, voice_script, plain_language_body, is_starter) VALUES
(NULL, 'Libraries', 'Library overdue notice', 'Your library item is overdue',
 'Hello,\n\nYour library item is overdue. You can return it to the library or renew it online if eligible.\n\nThank you.',
 'Your library item is overdue. Return it or renew online if eligible.',
 'Hello. This is a reminder that your library item is overdue. You may return it to the library, or renew it online if you are eligible.',
 'Your library item is overdue. You can return it to the library or renew it online if eligible.', true),
(NULL, 'Fundraising', 'Donation reminder', 'Reminder about your upcoming donation pledge',
 'Thank you for supporting our mission. This is a reminder about your upcoming donation pledge.',
 'Thanks for supporting our mission. Reminder about your upcoming donation pledge.',
 'Hello. Thank you for supporting our mission. This is a reminder about your upcoming donation pledge.',
 'Thank you for supporting us. This is a reminder about your upcoming donation.', true),
(NULL, 'Volunteers', 'Volunteer shift reminder', 'Your volunteer shift is coming up',
 'Your volunteer shift is coming up. Please review the details and let us know if you need assistance.',
 'Your volunteer shift is coming up. Reply if you need assistance.',
 'Hello. Your volunteer shift is coming up. Please review the details, and let us know if you need any assistance.',
 'Your volunteer shift is soon. Please review the details. Tell us if you need help.', true),
(NULL, 'Events', 'Event reminder', 'You are registered for an upcoming event',
 'You are registered for an upcoming event. Please review the date, time, location, and accessibility details.',
 'Reminder: you are registered for an upcoming event. Check date, time, location, accessibility details.',
 'Hello. You are registered for an upcoming event. Please review the date, time, location, and accessibility details.',
 'You signed up for an event. Please check the date, time, place, and accessibility info.', true);
