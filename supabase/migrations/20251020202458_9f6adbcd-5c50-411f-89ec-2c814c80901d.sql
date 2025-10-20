-- Create enum for review reply status
CREATE TYPE review_reply_status AS ENUM (
  'pending_ai',
  'awaiting_approval', 
  'approved',
  'posted',
  'rejected'
);

-- Create enum for approval actions
CREATE TYPE approval_action AS ENUM (
  'approved',
  'rejected',
  'edited',
  'posted'
);

-- Create gbp_reviews table
CREATE TABLE public.gbp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gbp_profile_id UUID NOT NULL REFERENCES public.gbp_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  google_review_id TEXT NOT NULL UNIQUE,
  reviewer_name TEXT NOT NULL,
  reviewer_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reply_status review_reply_status DEFAULT 'pending_ai',
  ai_generated_response TEXT,
  edited_response TEXT,
  final_response TEXT,
  posted_at TIMESTAMP WITH TIME ZONE,
  google_reply_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create gbp_review_approvals table for audit trail
CREATE TABLE public.gbp_review_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.gbp_reviews(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL,
  action approval_action NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add settings columns to gbp_profiles
ALTER TABLE public.gbp_profiles
ADD COLUMN IF NOT EXISTS auto_response_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS response_settings JSONB DEFAULT '{"tone": "professional", "approval_required": true}'::jsonb,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "in_app": true}'::jsonb;

-- Add updated_at trigger for gbp_reviews
CREATE TRIGGER update_gbp_reviews_updated_at
  BEFORE UPDATE ON public.gbp_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.gbp_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gbp_review_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gbp_reviews
CREATE POLICY "Org members can view reviews"
  ON public.gbp_reviews FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage reviews"
  ON public.gbp_reviews FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "System can insert reviews"
  ON public.gbp_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update reviews"
  ON public.gbp_reviews FOR UPDATE
  USING (true);

-- RLS Policies for gbp_review_approvals
CREATE POLICY "Org members can view approvals"
  ON public.gbp_review_approvals FOR SELECT
  USING (
    review_id IN (
      SELECT id FROM public.gbp_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org admins can create approvals"
  ON public.gbp_review_approvals FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM public.gbp_reviews
      WHERE organization_id IN (
        SELECT organization_id FROM public.memberships
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_gbp_reviews_profile_id ON public.gbp_reviews(gbp_profile_id);
CREATE INDEX idx_gbp_reviews_org_id ON public.gbp_reviews(organization_id);
CREATE INDEX idx_gbp_reviews_status ON public.gbp_reviews(reply_status);
CREATE INDEX idx_gbp_reviews_google_id ON public.gbp_reviews(google_review_id);
CREATE INDEX idx_gbp_review_approvals_review_id ON public.gbp_review_approvals(review_id);