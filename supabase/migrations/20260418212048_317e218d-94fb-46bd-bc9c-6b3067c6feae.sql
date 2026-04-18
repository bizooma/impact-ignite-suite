-- Subtasks: self-referential parent
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_task_id);

-- Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments(task_id, created_at);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view task comments"
  ON public.task_comments FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND author_id = auth.uid());

CREATE POLICY "Authors can update their comments"
  ON public.task_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors or org admins can delete comments"
  ON public.task_comments FOR DELETE
  USING (author_id = auth.uid() OR has_org_role(auth.uid(), organization_id, 'admin'::app_role) OR has_org_role(auth.uid(), organization_id, 'owner'::app_role));

CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity log
CREATE TABLE IF NOT EXISTS public.task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON public.task_activity(task_id, created_at DESC);

ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view task activity"
  ON public.task_activity FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can insert activity"
  ON public.task_activity FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));