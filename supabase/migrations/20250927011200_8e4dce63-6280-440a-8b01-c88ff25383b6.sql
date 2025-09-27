-- Create platform roles table for super admin designation
CREATE TABLE public.platform_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on platform_roles
ALTER TABLE public.platform_roles ENABLE ROW LEVEL SECURITY;

-- Add is_platform_admin to profiles table
ALTER TABLE public.profiles ADD COLUMN is_platform_admin BOOLEAN DEFAULT false;

-- Create security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_roles
    WHERE user_id = _user_id
      AND role = 'platform_admin'
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_platform_admin = true
  )
$$;

-- Create audit log table for platform admin actions
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Platform admin policies for platform_roles table
CREATE POLICY "Platform admins can view all platform roles"
ON public.platform_roles
FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage platform roles"
ON public.platform_roles
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Platform admin policies for admin_audit_logs
CREATE POLICY "Platform admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Platform admin can bypass organization restrictions
CREATE POLICY "Platform admins can view all organizations"
ON public.organizations
FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all organizations"
ON public.organizations
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Platform admin can view all memberships
CREATE POLICY "Platform admins can view all memberships"
ON public.memberships
FOR SELECT
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can manage all memberships"
ON public.memberships
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Platform admin can view all user profiles
CREATE POLICY "Platform admins can manage all profiles"
ON public.profiles
FOR ALL
USING (is_platform_admin(auth.uid()));

-- Create trigger for updated_at on platform_roles
CREATE TRIGGER update_platform_roles_updated_at
BEFORE UPDATE ON public.platform_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert platform admin role for joe@bizooma.com
-- First we need to find or create the user profile
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user exists in auth.users (this won't work in migration, but shows intent)
  -- The actual user creation will need to happen after they sign up
  
  -- For now, we'll create a function to grant admin access
END $$;

-- Function to grant platform admin access
CREATE OR REPLACE FUNCTION public.grant_platform_admin(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = _email;
  
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Update profile to be platform admin
  UPDATE public.profiles
  SET is_platform_admin = true, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Insert platform role
  INSERT INTO public.platform_roles (user_id, role, granted_by)
  VALUES (target_user_id, 'platform_admin', target_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN true;
END;
$$;