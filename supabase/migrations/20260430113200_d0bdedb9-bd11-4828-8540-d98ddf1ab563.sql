ALTER TABLE public.crm_grants
  ADD CONSTRAINT crm_grants_amount_requested_nonneg CHECK (amount_requested IS NULL OR amount_requested >= 0),
  ADD CONSTRAINT crm_grants_amount_awarded_nonneg CHECK (amount_awarded IS NULL OR amount_awarded >= 0);

ALTER TABLE public.crm_volunteer_hours
  ADD CONSTRAINT crm_volunteer_hours_hours_positive CHECK (hours > 0 AND hours <= 24);