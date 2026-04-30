ALTER TABLE public.crm_donations
  ADD CONSTRAINT crm_donations_amount_positive CHECK (amount > 0);