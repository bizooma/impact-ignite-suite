-- Enums
CREATE TYPE public.accessibility_issue_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.accessibility_issue_category AS ENUM ('image', 'form', 'heading', 'structure', 'contrast', 'link', 'language', 'other');
CREATE TYPE public.accessibility_scan_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Sites
CREATE TABLE public.accessibility_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain text NOT NULL,
  business_name text,
  site_id text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessibility_sites_org ON public.accessibility_sites(organization_id);
CREATE INDEX idx_accessibility_sites_site_id ON public.accessibility_sites(site_id);

-- Scans
CREATE TABLE public.accessibility_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.accessibility_sites(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  pages_scanned integer NOT NULL DEFAULT 1,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.accessibility_scan_status NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessibility_scans_site ON public.accessibility_scans(site_id, created_at DESC);

-- Issues
CREATE TABLE public.accessibility_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES public.accessibility_scans(id) ON DELETE CASCADE,
  category public.accessibility_issue_category NOT NULL,
  severity public.accessibility_issue_severity NOT NULL,
  description text NOT NULL,
  recommendation text NOT NULL,
  element_snippet text,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_accessibility_issues_scan ON public.accessibility_issues(scan_id);

-- Settings (one per site)
CREATE TABLE public.accessibility_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL UNIQUE REFERENCES public.accessibility_sites(id) ON DELETE CASCADE,
  high_contrast boolean NOT NULL DEFAULT true,
  font_scaling boolean NOT NULL DEFAULT true,
  reduced_motion boolean NOT NULL DEFAULT true,
  spacing boolean NOT NULL DEFAULT true,
  highlight_links boolean NOT NULL DEFAULT true,
  widget_active boolean NOT NULL DEFAULT true,
  statement_text text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create settings row when site is created
CREATE OR REPLACE FUNCTION public.create_accessibility_settings_for_site()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.accessibility_settings (site_id) VALUES (NEW.id) ON CONFLICT (site_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_create_accessibility_settings
AFTER INSERT ON public.accessibility_sites
FOR EACH ROW EXECUTE FUNCTION public.create_accessibility_settings_for_site();

-- Updated_at triggers
CREATE TRIGGER trg_accessibility_sites_updated_at
BEFORE UPDATE ON public.accessibility_sites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_accessibility_settings_updated_at
BEFORE UPDATE ON public.accessibility_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.accessibility_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_settings ENABLE ROW LEVEL SECURITY;

-- Sites policies
CREATE POLICY "Org members can view sites" ON public.accessibility_sites
  FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins can manage sites" ON public.accessibility_sites
  FOR ALL USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role))
  WITH CHECK (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

-- Scans policies
CREATE POLICY "Org members can view scans" ON public.accessibility_scans
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.accessibility_sites s WHERE s.id = accessibility_scans.site_id AND is_org_member(auth.uid(), s.organization_id)));
CREATE POLICY "Org admins can manage scans" ON public.accessibility_scans
  FOR ALL USING (EXISTS (SELECT 1 FROM public.accessibility_sites s WHERE s.id = accessibility_scans.site_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.accessibility_sites s WHERE s.id = accessibility_scans.site_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))));

-- Issues policies
CREATE POLICY "Org members can view issues" ON public.accessibility_issues
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.accessibility_scans sc JOIN public.accessibility_sites s ON s.id = sc.site_id WHERE sc.id = accessibility_issues.scan_id AND is_org_member(auth.uid(), s.organization_id)));
CREATE POLICY "Org admins can manage issues" ON public.accessibility_issues
  FOR ALL USING (EXISTS (SELECT 1 FROM public.accessibility_scans sc JOIN public.accessibility_sites s ON s.id = sc.site_id WHERE sc.id = accessibility_issues.scan_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.accessibility_scans sc JOIN public.accessibility_sites s ON s.id = sc.site_id WHERE sc.id = accessibility_issues.scan_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))));

-- Settings policies
CREATE POLICY "Public can read widget settings" ON public.accessibility_settings
  FOR SELECT USING (true);
CREATE POLICY "Org admins can manage settings" ON public.accessibility_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.accessibility_sites s WHERE s.id = accessibility_settings.site_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.accessibility_sites s WHERE s.id = accessibility_settings.site_id AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))));