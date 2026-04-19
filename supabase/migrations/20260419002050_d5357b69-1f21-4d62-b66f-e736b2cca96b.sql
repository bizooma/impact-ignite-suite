
-- Enums
CREATE TYPE public.campaign_status AS ENUM ('draft','active','completed','archived');
CREATE TYPE public.campaign_phase AS ENUM ('awareness','engagement','push','day_of','stewardship');
CREATE TYPE public.campaign_asset_type AS ENUM ('social_post','email_draft','sms_draft','task','qr_code','chatbot_faq','landing_section','gbp_post');
CREATE TYPE public.campaign_milestone_status AS ENUM ('todo','in_progress','completed','skipped');

-- marketing_campaigns
CREATE TABLE public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  template_key TEXT,
  goal_amount NUMERIC(12,2),
  goal_donors INTEGER,
  goal_currency TEXT DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  event_date DATE,
  theme_color TEXT DEFAULT '#3b82f6',
  hero_image_url TEXT,
  tagline TEXT,
  story TEXT,
  audience_segments JSONB DEFAULT '[]'::jsonb,
  channels JSONB DEFAULT '{"social":true,"email":true,"sms":false,"chatbot":true,"qr":true,"gbp":true}'::jsonb,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);
CREATE INDEX idx_marketing_campaigns_org ON public.marketing_campaigns(organization_id);

-- milestones
CREATE TABLE public.campaign_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  phase public.campaign_phase NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status public.campaign_milestone_status NOT NULL DEFAULT 'todo',
  owner_id UUID,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_milestones_campaign ON public.campaign_milestones(campaign_id);

-- assets
CREATE TABLE public.campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  asset_type public.campaign_asset_type NOT NULL,
  asset_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_campaign_assets_campaign ON public.campaign_assets(campaign_id);

-- metrics snapshots
CREATE TABLE public.campaign_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  donations_count INTEGER DEFAULT 0,
  donations_amount NUMERIC(12,2) DEFAULT 0,
  new_donors INTEGER DEFAULT 0,
  social_reach INTEGER DEFAULT 0,
  social_engagement INTEGER DEFAULT 0,
  qr_scans INTEGER DEFAULT 0,
  chat_sessions INTEGER DEFAULT 0,
  emails_drafted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, snapshot_date)
);

-- Add campaign_id to existing tables (where missing)
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.qr_codes ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.crm_interactions ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.crm_donations ADD COLUMN IF NOT EXISTS marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

-- Triggers updated_at
CREATE TRIGGER trg_marketing_campaigns_updated BEFORE UPDATE ON public.marketing_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_campaign_milestones_updated BEFORE UPDATE ON public.campaign_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_campaign_assets_updated BEFORE UPDATE ON public.campaign_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaigns" ON public.marketing_campaigns
  FOR SELECT USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins can manage campaigns" ON public.marketing_campaigns
  FOR ALL USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role))
  WITH CHECK (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE POLICY "Org members can view milestones" ON public.campaign_milestones
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_milestones.campaign_id AND is_org_member(auth.uid(), mc.organization_id)));
CREATE POLICY "Org admins can manage milestones" ON public.campaign_milestones
  FOR ALL USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_milestones.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_milestones.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))));

CREATE POLICY "Org members can view assets" ON public.campaign_assets
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_assets.campaign_id AND is_org_member(auth.uid(), mc.organization_id)));
CREATE POLICY "Org admins can manage assets" ON public.campaign_assets
  FOR ALL USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_assets.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_assets.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))));

CREATE POLICY "Org members can view metrics" ON public.campaign_metrics_snapshots
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_metrics_snapshots.campaign_id AND is_org_member(auth.uid(), mc.organization_id)));
CREATE POLICY "Org admins can manage metrics" ON public.campaign_metrics_snapshots
  FOR ALL USING (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_metrics_snapshots.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.marketing_campaigns mc WHERE mc.id = campaign_metrics_snapshots.campaign_id AND (has_org_role(auth.uid(), mc.organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), mc.organization_id, 'owner'::app_role))));
