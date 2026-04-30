
-- Expand accessibility_settings with new feature toggles
ALTER TABLE public.accessibility_settings
  ADD COLUMN IF NOT EXISTS dyslexia_font boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS letter_spacing boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS line_height boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS font_weight_adj boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS saturation_adj boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS monochrome boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS color_pickers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reading_mask boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reading_guide boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS big_cursor boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stop_animations boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS page_structure boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS profiles_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS language_selector boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS report_issue boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS oversize_widget boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS statement_url text;

-- Feedback table for issues submitted via the widget
CREATE TABLE IF NOT EXISTS public.accessibility_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL,
  name text,
  email text,
  message text NOT NULL,
  page_url text,
  user_agent text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_a11y_feedback_site ON public.accessibility_feedback(site_id, created_at DESC);

ALTER TABLE public.accessibility_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (including the public widget via edge function) can insert feedback
CREATE POLICY "Anyone can submit accessibility feedback"
  ON public.accessibility_feedback
  FOR INSERT
  WITH CHECK (true);

-- Org members can view feedback for their site
CREATE POLICY "Org members can view feedback"
  ON public.accessibility_feedback
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.accessibility_sites s
    WHERE s.id = accessibility_feedback.site_id
      AND is_org_member(auth.uid(), s.organization_id)
  ));

-- Org admins/owners can update and delete feedback
CREATE POLICY "Org admins can update feedback"
  ON public.accessibility_feedback
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.accessibility_sites s
    WHERE s.id = accessibility_feedback.site_id
      AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role)
        OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))
  ));

CREATE POLICY "Org admins can delete feedback"
  ON public.accessibility_feedback
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.accessibility_sites s
    WHERE s.id = accessibility_feedback.site_id
      AND (has_org_role(auth.uid(), s.organization_id, 'admin'::app_role)
        OR has_org_role(auth.uid(), s.organization_id, 'owner'::app_role))
  ));

CREATE TRIGGER update_a11y_feedback_updated_at
  BEFORE UPDATE ON public.accessibility_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
