-- Enums
CREATE TYPE public.support_thread_status AS ENUM ('open', 'closed');
CREATE TYPE public.support_sender_role AS ENUM ('user', 'support');

-- support_threads
CREATE TABLE public.support_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  subject TEXT,
  status public.support_thread_status NOT NULL DEFAULT 'open',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_threads_org ON public.support_threads(organization_id);
CREATE INDEX idx_support_threads_last_msg ON public.support_threads(last_message_at DESC);

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their threads"
  ON public.support_threads FOR SELECT
  USING (is_org_member(auth.uid(), organization_id) OR is_platform_admin(auth.uid()));

CREATE POLICY "Org members can create threads"
  ON public.support_threads FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Platform admins can update threads"
  ON public.support_threads FOR UPDATE
  USING (is_platform_admin(auth.uid()));

CREATE TRIGGER update_support_threads_updated_at
  BEFORE UPDATE ON public.support_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- support_messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role public.support_sender_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_messages_thread ON public.support_messages(thread_id, created_at);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages on accessible threads"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = support_messages.thread_id
        AND (is_org_member(auth.uid(), t.organization_id) OR is_platform_admin(auth.uid()))
    )
  );

CREATE POLICY "Org members can insert user messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (sender_role = 'user' AND EXISTS (
        SELECT 1 FROM public.support_threads t
        WHERE t.id = thread_id AND is_org_member(auth.uid(), t.organization_id)
      ))
      OR (sender_role = 'support' AND is_platform_admin(auth.uid()))
    )
  );

-- Trigger: bump thread last_message_at and reopen on new message
CREATE OR REPLACE FUNCTION public.bump_support_thread_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_threads
    SET last_message_at = NEW.created_at,
        status = 'open',
        updated_at = now()
    WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_support_thread_on_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_support_thread_on_message();

-- Realtime
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.support_threads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_threads;