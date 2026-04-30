ALTER TABLE public.org_events
  ADD CONSTRAINT org_events_capacity_positive
  CHECK (capacity IS NULL OR (capacity > 0 AND capacity <= 1000000));