-- Allow platform admins to manage all mobile app databases
CREATE POLICY "Platform admins can manage all mobile app databases"
ON public.mobile_app_databases
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));