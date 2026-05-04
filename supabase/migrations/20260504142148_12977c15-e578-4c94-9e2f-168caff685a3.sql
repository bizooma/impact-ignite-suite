
-- Enums for campaign brief
DO $$ BEGIN
  CREATE TYPE public.campaign_objective AS ENUM (
    'fundraise', 'awareness', 'recruit_volunteers', 'event_attendance', 'advocacy', 'stewardship'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.campaign_tone AS ENUM (
    'warm', 'urgent', 'celebratory', 'professional', 'playful'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.brief_status AS ENUM ('draft', 'complete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- campaign_briefs table (1:1 with marketing_campaigns)
CREATE TABLE IF NOT EXISTS public.campaign_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  objective public.campaign_objective NOT NULL DEFAULT 'fundraise',
  primary_goal_amount numeric,
  primary_goal_donors integer,
  goal_currency text NOT NULL DEFAULT 'USD',
  audience_description text,
  audience_segments jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_message text,
  tone public.campaign_tone NOT NULL DEFAULT 'warm',
  call_to_action text,
  landing_url text,
  channels jsonb NOT NULL DEFAULT '{"social":true,"email":true,"sms":false,"chatbot":true,"qr":true,"gbp":true}'::jsonb,
  start_date date,
  end_date date,
  event_date date,
  theme_color text NOT NULL DEFAULT '#2E4F9E',
  hero_image_url text,
  status public.brief_status NOT NULL DEFAULT 'draft',
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_briefs_org ON public.campaign_briefs(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_campaign ON public.campaign_briefs(campaign_id);

ALTER TABLE public.campaign_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view campaign briefs"
  ON public.campaign_briefs FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert campaign briefs"
  ON public.campaign_briefs FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update campaign briefs"
  ON public.campaign_briefs FOR UPDATE
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can delete campaign briefs"
  ON public.campaign_briefs FOR DELETE
  USING (public.is_org_member(auth.uid(), organization_id));

-- Trigger: stamp completed_at when status flips to complete
CREATE OR REPLACE FUNCTION public.stamp_brief_completed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'complete' AND (OLD.status IS DISTINCT FROM 'complete') THEN
    NEW.completed_at := now();
  ELSIF NEW.status = 'draft' THEN
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brief_completed_at ON public.campaign_briefs;
CREATE TRIGGER trg_brief_completed_at
  BEFORE INSERT OR UPDATE ON public.campaign_briefs
  FOR EACH ROW EXECUTE FUNCTION public.stamp_brief_completed_at();

-- Link social_posts to marketing_campaigns
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS marketing_campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_marketing_campaign
  ON public.social_posts(marketing_campaign_id);
