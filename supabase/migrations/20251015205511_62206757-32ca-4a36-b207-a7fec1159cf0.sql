-- Phase 4: Update RLS policies for membership management
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Organization admins can manage non-owner memberships" ON public.memberships;
DROP POLICY IF EXISTS "Organization owners can manage all memberships" ON public.memberships;

-- Allow owners to manage all memberships in their organization
CREATE POLICY "Organization owners can manage memberships"
ON public.memberships
FOR ALL
USING (
  has_org_role(auth.uid(), organization_id, 'owner'::app_role)
)
WITH CHECK (
  has_org_role(auth.uid(), organization_id, 'owner'::app_role)
);

-- Prevent users from changing their own role (security measure)
CREATE POLICY "Users cannot change their own role"
ON public.memberships
FOR UPDATE
USING (user_id != auth.uid())
WITH CHECK (user_id != auth.uid());

-- Ensure owners cannot delete themselves
CREATE POLICY "Users cannot delete their own membership"
ON public.memberships
FOR DELETE
USING (user_id != auth.uid());