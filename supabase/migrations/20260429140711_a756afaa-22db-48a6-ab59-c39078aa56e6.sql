
DO $$ BEGIN
  CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.org_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  requested_email TEXT NOT NULL,
  requested_role public.app_role NOT NULL DEFAULT 'viewer',
  status public.join_request_status NOT NULL DEFAULT 'pending',
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS org_join_requests_unique_pending
  ON public.org_join_requests (organization_id, user_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_org_join_requests_org_status
  ON public.org_join_requests (organization_id, status);

ALTER TABLE public.org_join_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_org_join_requests_updated_at ON public.org_join_requests;
CREATE TRIGGER trg_org_join_requests_updated_at
  BEFORE UPDATE ON public.org_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Users can view own join requests" ON public.org_join_requests;
CREATE POLICY "Users can view own join requests"
  ON public.org_join_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can view org join requests" ON public.org_join_requests;
CREATE POLICY "Owners can view org join requests"
  ON public.org_join_requests FOR SELECT
  TO authenticated
  USING (
    public.has_org_role(auth.uid(), organization_id, 'owner'::public.app_role)
    OR public.is_platform_admin(auth.uid())
  );

CREATE OR REPLACE FUNCTION public.request_org_join(p_mobile_app_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org RECORD;
  _user_id UUID := auth.uid();
  _user_email TEXT;
  _existing_membership_id UUID;
  _existing_request_id UUID;
  _request_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_mobile_app_code IS NULL OR length(trim(p_mobile_app_code)) = 0 THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = '22023';
  END IF;

  SELECT id, name, owner_id INTO _org
    FROM public.organizations
    WHERE mobile_app_code = p_mobile_app_code
    LIMIT 1;

  IF _org.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  SELECT id INTO _existing_membership_id
    FROM public.memberships
    WHERE user_id = _user_id AND organization_id = _org.id
    LIMIT 1;

  IF _existing_membership_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_member',
      'organization_id', _org.id,
      'organization_name', _org.name
    );
  END IF;

  SELECT id INTO _existing_request_id
    FROM public.org_join_requests
    WHERE user_id = _user_id AND organization_id = _org.id AND status = 'pending'
    LIMIT 1;

  IF _existing_request_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_pending',
      'request_id', _existing_request_id,
      'organization_id', _org.id,
      'organization_name', _org.name
    );
  END IF;

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  INSERT INTO public.org_join_requests (organization_id, user_id, requested_email, requested_role, status)
  VALUES (_org.id, _user_id, COALESCE(_user_email, ''), 'viewer', 'pending')
  RETURNING id INTO _request_id;

  RETURN jsonb_build_object(
    'status', 'pending',
    'request_id', _request_id,
    'organization_id', _org.id,
    'organization_name', _org.name,
    'owner_id', _org.owner_id,
    'requester_email', _user_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_org_join(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_org_join(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.decide_org_join_request(
  p_request_id UUID,
  p_decision TEXT,
  p_role public.app_role DEFAULT 'viewer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _req RECORD;
  _is_owner BOOLEAN;
  _is_platform_admin BOOLEAN;
  _decider UUID := auth.uid();
BEGIN
  IF _decider IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'invalid_decision' USING ERRCODE = '22023';
  END IF;

  IF p_role NOT IN ('viewer'::public.app_role, 'editor'::public.app_role, 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'invalid_role' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO _req FROM public.org_join_requests WHERE id = p_request_id FOR UPDATE;

  IF _req.id IS NULL THEN
    RAISE EXCEPTION 'request_not_found' USING ERRCODE = '02000';
  END IF;

  IF _req.status <> 'pending' THEN
    RAISE EXCEPTION 'request_not_pending' USING ERRCODE = '22023';
  END IF;

  _is_owner := public.has_org_role(_decider, _req.organization_id, 'owner'::public.app_role);
  _is_platform_admin := public.is_platform_admin(_decider);

  IF NOT (_is_owner OR _is_platform_admin) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  IF p_decision = 'approve' THEN
    INSERT INTO public.memberships (user_id, organization_id, role)
    VALUES (_req.user_id, _req.organization_id, p_role)
    ON CONFLICT DO NOTHING;

    UPDATE public.org_join_requests
      SET status = 'approved',
          decided_by = _decider,
          decided_at = now(),
          requested_role = p_role
      WHERE id = p_request_id;
  ELSE
    UPDATE public.org_join_requests
      SET status = 'rejected',
          decided_by = _decider,
          decided_at = now()
      WHERE id = p_request_id;
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'decision', p_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.decide_org_join_request(UUID, TEXT, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_org_join_request(UUID, TEXT, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.count_pending_join_requests(p_org_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.org_join_requests
  WHERE organization_id = p_org_id
    AND status = 'pending'
    AND (
      public.has_org_role(auth.uid(), p_org_id, 'owner'::public.app_role)
      OR public.is_platform_admin(auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.count_pending_join_requests(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_pending_join_requests(UUID) TO authenticated;
