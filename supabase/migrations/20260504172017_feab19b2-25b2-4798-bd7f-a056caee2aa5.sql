
-- ============================================================
-- BRAND KITS
-- ============================================================
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Colors
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  text_color TEXT,
  background_color TEXT,
  extended_palette JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Typography
  heading_font_family TEXT,
  body_font_family TEXT,
  heading_font_url TEXT,
  body_font_url TEXT,
  heading_font_weight TEXT,
  body_font_weight TEXT,

  -- Logos
  logo_primary_url TEXT,
  logo_mark_url TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,

  -- Voice & content
  tagline TEXT,
  mission_statement TEXT,
  voice_descriptors JSONB NOT NULL DEFAULT '[]'::jsonb,
  do_use TEXT,
  dont_use TEXT,

  -- Status
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','pdf_import','hybrid')),
  setup_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_kits_org ON public.brand_kits(organization_id);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brand kit"
  ON public.brand_kits FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins/owners can insert brand kit"
  ON public.brand_kits FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Org admins/owners can update brand kit"
  ON public.brand_kits FOR UPDATE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Org admins/owners can delete brand kit"
  ON public.brand_kits FOR DELETE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE TRIGGER trg_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BRAND KIT IMPORTS (PDF upload tracking)
-- ============================================================
CREATE TABLE public.brand_kit_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pdf_file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','error')),
  extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_kit_imports_org ON public.brand_kit_imports(organization_id);
CREATE INDEX idx_brand_kit_imports_status ON public.brand_kit_imports(status);

ALTER TABLE public.brand_kit_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brand kit imports"
  ON public.brand_kit_imports FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins/owners can insert brand kit imports"
  ON public.brand_kit_imports FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Org admins/owners can update brand kit imports"
  ON public.brand_kit_imports FOR UPDATE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Org admins/owners can delete brand kit imports"
  ON public.brand_kit_imports FOR DELETE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE TRIGGER trg_brand_kit_imports_updated_at
  BEFORE UPDATE ON public.brand_kit_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ORG ONBOARDING STATE
-- ============================================================
CREATE TABLE public.org_onboarding_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_kit_done BOOLEAN NOT NULL DEFAULT false,
  integration_connected BOOLEAN NOT NULL DEFAULT false,
  first_asset_created BOOLEAN NOT NULL DEFAULT false,
  team_member_invited BOOLEAN NOT NULL DEFAULT false,
  dismissed_banners JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_onboarding_state_org ON public.org_onboarding_state(organization_id);

ALTER TABLE public.org_onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view onboarding state"
  ON public.org_onboarding_state FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins/owners can insert onboarding state"
  ON public.org_onboarding_state FOR INSERT TO authenticated
  WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE POLICY "Org admins/owners can update onboarding state"
  ON public.org_onboarding_state FOR UPDATE TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE TRIGGER trg_org_onboarding_state_updated_at
  BEFORE UPDATE ON public.org_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PER-ASSET OVERRIDE FLAGS
-- ============================================================
ALTER TABLE public.chatbots
  ADD COLUMN IF NOT EXISTS use_brand_kit BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS use_brand_kit BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- STORAGE BUCKET: brand-kits (public for logo display)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-kits', 'brand-kits', true)
ON CONFLICT (id) DO NOTHING;

-- Public read (logos must render in public chatbot widget, social previews, etc.)
CREATE POLICY "Brand kit assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-kits');

-- Authenticated org admins/owners can upload to their org folder.
-- Convention: files stored under `${organization_id}/...`
CREATE POLICY "Org admins/owners can upload brand kit assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'brand-kits'
    AND (
      public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'owner'::public.app_role)
      OR public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::public.app_role)
      OR public.is_platform_admin(auth.uid())
    )
  );

CREATE POLICY "Org admins/owners can update brand kit assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'brand-kits'
    AND (
      public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'owner'::public.app_role)
      OR public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::public.app_role)
      OR public.is_platform_admin(auth.uid())
    )
  );

CREATE POLICY "Org admins/owners can delete brand kit assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'brand-kits'
    AND (
      public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'owner'::public.app_role)
      OR public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'admin'::public.app_role)
      OR public.is_platform_admin(auth.uid())
    )
  );
