CREATE TABLE public.product_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'feature_request' CHECK (type IN ('feature_request','feedback','bug')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','planned','shipped','declined')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_feedback_status ON public.product_feedback(status);
CREATE INDEX idx_product_feedback_created_at ON public.product_feedback(created_at DESC);
CREATE INDEX idx_product_feedback_org ON public.product_feedback(organization_id);

ALTER TABLE public.product_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can submit feedback"
  ON public.product_feedback
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
  );

CREATE POLICY "Platform admins can view feedback"
  ON public.product_feedback
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update feedback"
  ON public.product_feedback
  FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete feedback"
  ON public.product_feedback
  FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

CREATE TRIGGER update_product_feedback_updated_at
  BEFORE UPDATE ON public.product_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();