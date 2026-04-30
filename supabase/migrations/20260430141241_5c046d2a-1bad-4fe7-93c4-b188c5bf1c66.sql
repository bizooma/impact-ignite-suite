UPDATE public.organizations
SET subscription_tier = 'enterprise',
    updated_at = now()
WHERE id IN (
  'd3751758-bf07-4bbe-a78b-661ae87f1f32',
  'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0'
);