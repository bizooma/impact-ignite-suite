-- Create flipbooks table
CREATE TABLE public.flipbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  thumbnail_url TEXT,
  page_count INTEGER DEFAULT 0,
  file_size INTEGER,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flipbook_embeds table
CREATE TABLE public.flipbook_embeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flipbook_id UUID NOT NULL REFERENCES public.flipbooks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(flipbook_id, organization_id)
);

-- Create storage bucket for flipbooks
INSERT INTO storage.buckets (id, name, public) 
VALUES ('flipbooks', 'flipbooks', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.flipbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_embeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flipbooks
-- Only Bizooma org members can create/update/delete flipbooks
CREATE POLICY "Bizooma members can manage flipbooks"
ON public.flipbooks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = flipbooks.organization_id
    AND o.slug = 'bizooma'
    AND is_org_member(auth.uid(), o.id)
  )
);

-- All authenticated users can view active flipbooks
CREATE POLICY "Users can view active flipbooks"
ON public.flipbooks
FOR SELECT
USING (is_active = true);

-- RLS Policies for flipbook_embeds
-- Only Bizooma members can manage embeds
CREATE POLICY "Bizooma members can manage embeds"
ON public.flipbook_embeds
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks f
    JOIN public.organizations o ON o.id = f.organization_id
    WHERE f.id = flipbook_embeds.flipbook_id
    AND o.slug = 'bizooma'
    AND is_org_member(auth.uid(), o.id)
  )
);

-- Users can view embeds for their organization
CREATE POLICY "Users can view their org embeds"
ON public.flipbook_embeds
FOR SELECT
USING (is_org_member(auth.uid(), organization_id));

-- Storage policies for flipbooks bucket
CREATE POLICY "Bizooma members can upload to flipbooks"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'flipbooks' AND
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.memberships m ON m.organization_id = o.id
    WHERE o.slug = 'bizooma'
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view flipbook files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'flipbooks');

CREATE POLICY "Bizooma members can update flipbook files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'flipbooks' AND
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.memberships m ON m.organization_id = o.id
    WHERE o.slug = 'bizooma'
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Bizooma members can delete flipbook files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'flipbooks' AND
  EXISTS (
    SELECT 1 FROM public.organizations o
    JOIN public.memberships m ON m.organization_id = o.id
    WHERE o.slug = 'bizooma'
    AND m.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_flipbooks_updated_at
BEFORE UPDATE ON public.flipbooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_flipbooks_organization_id ON public.flipbooks(organization_id);
CREATE INDEX idx_flipbooks_is_active ON public.flipbooks(is_active);
CREATE INDEX idx_flipbook_embeds_flipbook_id ON public.flipbook_embeds(flipbook_id);
CREATE INDEX idx_flipbook_embeds_organization_id ON public.flipbook_embeds(organization_id);