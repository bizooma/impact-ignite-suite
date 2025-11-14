-- Add RLS policy for platform admins to view beta signups
CREATE POLICY "Platform admins can view beta signups"
ON public.beta_signups
FOR SELECT
TO authenticated
USING (is_platform_admin(auth.uid()));

-- Add policy for platform admins to delete beta signups
CREATE POLICY "Platform admins can delete beta signups"
ON public.beta_signups
FOR DELETE
TO authenticated
USING (is_platform_admin(auth.uid()));