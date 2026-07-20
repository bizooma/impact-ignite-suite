
CREATE TABLE public.ai_visibility_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL,
  prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  platforms text[] NOT NULL DEFAULT '{}',
  total_checks int NOT NULL DEFAULT 0,
  mention_count int NOT NULL DEFAULT 0,
  citation_count int NOT NULL DEFAULT 0,
  overall_score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_visibility_runs TO authenticated;
GRANT ALL ON public.ai_visibility_runs TO service_role;
ALTER TABLE public.ai_visibility_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs" ON public.ai_visibility_runs FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.ai_visibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.ai_visibility_runs(id) ON DELETE CASCADE,
  platform text NOT NULL,
  prompt text NOT NULL,
  has_mention boolean NOT NULL DEFAULT false,
  is_citation boolean NOT NULL DEFAULT false,
  confidence numeric NOT NULL DEFAULT 0,
  mention_text text,
  competitors text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_visibility_results TO authenticated;
GRANT ALL ON public.ai_visibility_results TO service_role;
ALTER TABLE public.ai_visibility_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own results" ON public.ai_visibility_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_visibility_runs r WHERE r.id = run_id AND r.user_id = auth.uid()));

CREATE INDEX ai_visibility_runs_user_created_idx ON public.ai_visibility_runs(user_id, created_at DESC);
CREATE INDEX ai_visibility_results_run_idx ON public.ai_visibility_results(run_id);
