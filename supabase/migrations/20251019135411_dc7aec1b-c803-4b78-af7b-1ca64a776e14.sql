-- Create volunteers table for volunteer form submissions
CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  days TEXT[] DEFAULT '{}',
  public_key TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on volunteers
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Volunteers can be created by anyone (for public chatbot widgets)
CREATE POLICY "Anyone can submit volunteer forms"
ON public.volunteers
FOR INSERT
WITH CHECK (true);

-- Organization members can view volunteers for their chatbots
CREATE POLICY "Org members can view volunteers"
ON public.volunteers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = volunteers.chatbot_id
    AND is_org_member(auth.uid(), chatbots.organization_id)
  )
);

-- Organization admins can delete volunteers
CREATE POLICY "Org admins can delete volunteers"
ON public.volunteers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = volunteers.chatbot_id
    AND (
      has_org_role(auth.uid(), chatbots.organization_id, 'admin'::app_role)
      OR has_org_role(auth.uid(), chatbots.organization_id, 'owner'::app_role)
    )
  )
);

-- Create chatbot_faqs table for FAQ management
CREATE TABLE public.chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on chatbot_faqs
ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;

-- Organization admins can manage FAQs
CREATE POLICY "Org admins can manage FAQs"
ON public.chatbot_faqs
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_faqs.chatbot_id
    AND (
      has_org_role(auth.uid(), chatbots.organization_id, 'admin'::app_role)
      OR has_org_role(auth.uid(), chatbots.organization_id, 'owner'::app_role)
    )
  )
);

-- Anyone can view FAQs (for public chatbot widgets)
CREATE POLICY "Anyone can view FAQs"
ON public.chatbot_faqs
FOR SELECT
USING (true);

-- Create trigger for chatbot_faqs updated_at
CREATE TRIGGER update_chatbot_faqs_updated_at
BEFORE UPDATE ON public.chatbot_faqs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create chatbot_events table for analytics tracking
CREATE TABLE public.chatbot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on chatbot_events for faster queries
CREATE INDEX idx_chatbot_events_chatbot_id ON public.chatbot_events(chatbot_id);
CREATE INDEX idx_chatbot_events_created_at ON public.chatbot_events(created_at);
CREATE INDEX idx_chatbot_events_event_type ON public.chatbot_events(event_type);

-- Enable RLS on chatbot_events
ALTER TABLE public.chatbot_events ENABLE ROW LEVEL SECURITY;

-- Anyone can create events (for public chatbot widgets)
CREATE POLICY "Anyone can track events"
ON public.chatbot_events
FOR INSERT
WITH CHECK (true);

-- Organization members can view events for their chatbots
CREATE POLICY "Org members can view events"
ON public.chatbot_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_events.chatbot_id
    AND is_org_member(auth.uid(), chatbots.organization_id)
  )
);

-- Enable realtime for chatbot_events
ALTER TABLE public.chatbot_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_events;

-- Enable realtime for volunteers
ALTER TABLE public.volunteers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteers;