ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(organization_id, sort_order);