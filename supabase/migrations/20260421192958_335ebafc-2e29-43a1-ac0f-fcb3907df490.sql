-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Private settings table for trigger config (locked down — service-only)
CREATE TABLE IF NOT EXISTS public.support_notify_config (
  id smallint PRIMARY KEY DEFAULT 1,
  function_url text NOT NULL,
  notify_secret text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT support_notify_config_singleton CHECK (id = 1)
);

ALTER TABLE public.support_notify_config ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated. Only service_role + SECURITY DEFINER funcs can read.

-- Seed the row (replace later with rotated values if needed)
INSERT INTO public.support_notify_config (id, function_url, notify_secret)
VALUES (
  1,
  'https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/notify-support-message',
  encode(extensions.gen_random_bytes(32), 'hex')
)
ON CONFLICT (id) DO NOTHING;

-- Trigger function: posts to notify-support-message edge function on new user message
CREATE OR REPLACE FUNCTION public.notify_support_message_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _cfg record;
  _org_id uuid;
BEGIN
  IF NEW.sender_role IS DISTINCT FROM 'user' THEN
    RETURN NEW;
  END IF;

  SELECT function_url, notify_secret INTO _cfg
    FROM public.support_notify_config WHERE id = 1;

  IF _cfg.function_url IS NULL OR _cfg.notify_secret IS NULL THEN
    RAISE WARNING 'notify_support_message: missing config, skipping';
    RETURN NEW;
  END IF;

  SELECT organization_id INTO _org_id
    FROM public.support_threads WHERE id = NEW.thread_id;

  PERFORM net.http_post(
    url := _cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-notify-secret', _cfg.notify_secret
    ),
    body := jsonb_build_object(
      'thread_id', NEW.thread_id,
      'message_id', NEW.id,
      'sender_role', NEW.sender_role,
      'organization_id', _org_id,
      'content', NEW.content
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS support_message_notify_trigger ON public.support_messages;
CREATE TRIGGER support_message_notify_trigger
AFTER INSERT ON public.support_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_support_message_on_insert();