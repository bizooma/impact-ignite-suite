-- Create chatbot_faqs table
CREATE TABLE IF NOT EXISTS public.chatbot_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can manage FAQs" ON public.chatbot_faqs;
CREATE POLICY "Org admins can manage FAQs"
ON public.chatbot_faqs FOR ALL
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

DROP POLICY IF EXISTS "Anyone can view FAQs" ON public.chatbot_faqs;
CREATE POLICY "Anyone can view FAQs"
ON public.chatbot_faqs FOR SELECT USING (true);

DROP TRIGGER IF EXISTS update_chatbot_faqs_updated_at ON public.chatbot_faqs;
CREATE TRIGGER update_chatbot_faqs_updated_at
BEFORE UPDATE ON public.chatbot_faqs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create chatbot_events table
CREATE TABLE IF NOT EXISTS public.chatbot_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_events_chatbot_id ON public.chatbot_events(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_events_created_at ON public.chatbot_events(created_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_events_event_type ON public.chatbot_events(event_type);

ALTER TABLE public.chatbot_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track events" ON public.chatbot_events;
CREATE POLICY "Anyone can track events"
ON public.chatbot_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Org members can view events" ON public.chatbot_events;
CREATE POLICY "Org members can view events"
ON public.chatbot_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chatbots
    WHERE chatbots.id = chatbot_events.chatbot_id
    AND is_org_member(auth.uid(), chatbots.organization_id)
  )
);

-- Add tables to realtime publication only if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chatbot_events'
  ) THEN
    ALTER TABLE public.chatbot_events REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_events;
  END IF;
END $$;