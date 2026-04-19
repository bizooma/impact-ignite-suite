
-- 1. Add mobile API key columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mobile_api_key text UNIQUE,
  ADD COLUMN IF NOT EXISTS mobile_api_enabled boolean NOT NULL DEFAULT false;

-- 2. org_events
CREATE TABLE public.org_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  image_url text,
  capacity integer,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_events_org ON public.org_events(organization_id);
CREATE INDEX idx_org_events_starts_at ON public.org_events(starts_at);

ALTER TABLE public.org_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view events"
  ON public.org_events FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage events"
  ON public.org_events FOR ALL
  USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role))
  WITH CHECK (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE TRIGGER update_org_events_updated_at
  BEFORE UPDATE ON public.org_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. org_event_rsvps
CREATE TABLE public.org_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.org_events(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  guests integer NOT NULL DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_event_rsvps_event ON public.org_event_rsvps(event_id);

ALTER TABLE public.org_event_rsvps ENABLE ROW LEVEL SECURITY;

-- Public can insert (mobile app via edge function uses service role; this is a safety net)
CREATE POLICY "Anyone can RSVP"
  ON public.org_event_rsvps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can view RSVPs"
  ON public.org_event_rsvps FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.org_events e
    WHERE e.id = org_event_rsvps.event_id
      AND is_org_member(auth.uid(), e.organization_id)
  ));

CREATE POLICY "Org admins can delete RSVPs"
  ON public.org_event_rsvps FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.org_events e
    WHERE e.id = org_event_rsvps.event_id
      AND (has_org_role(auth.uid(), e.organization_id, 'admin'::app_role)
           OR has_org_role(auth.uid(), e.organization_id, 'owner'::app_role))
  ));

-- 4. org_success_stories
CREATE TABLE public.org_success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  body text,
  hero_image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_url text,
  category text,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  author_name text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);
CREATE INDEX idx_org_stories_org ON public.org_success_stories(organization_id);
CREATE INDEX idx_org_stories_published ON public.org_success_stories(organization_id, is_published);

ALTER TABLE public.org_success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stories"
  ON public.org_success_stories FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can manage stories"
  ON public.org_success_stories FOR ALL
  USING (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role))
  WITH CHECK (has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE TRIGGER update_org_success_stories_updated_at
  BEFORE UPDATE ON public.org_success_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Helper function: generate mobile API key
CREATE OR REPLACE FUNCTION public.generate_mobile_api_key(_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_key text;
BEGIN
  -- Only org admins/owners can call
  IF NOT (has_org_role(auth.uid(), _org_id, 'admin'::app_role)
          OR has_org_role(auth.uid(), _org_id, 'owner'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  new_key := 'mob_live_' || encode(gen_random_bytes(24), 'hex');

  UPDATE public.organizations
     SET mobile_api_key = new_key,
         mobile_api_enabled = true,
         updated_at = now()
   WHERE id = _org_id;

  RETURN new_key;
END;
$$;
