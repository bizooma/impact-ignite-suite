UPDATE public.qr_codes
SET short_url = 'https://svuxuhrsrawdqqkepeye.supabase.co/functions/v1/qr-redirect/' || id
WHERE (type = 'dynamic' OR type IS NULL)
  AND short_url IS NULL;