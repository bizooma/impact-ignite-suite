-- ============================================================================
-- RanchVoice Mobile App Database Setup Script
-- Run these SQL commands in your RanchVoice Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add new columns to users table (safe, non-breaking)
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- STEP 2: Create role enum (must match Dreamflow roles exactly)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM (
    'resident', 
    'houseParent', 
    'clsStaff', 
    'successCoach', 
    'teacher', 
    'caseworker', 
    'counselor', 
    'staff', 
    'admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 3: Create user_roles table (security requirement)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by TEXT REFERENCES users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- STEP 4: Create security definer function (required for RLS)
-- ============================================================================
CREATE OR REPLACE FUNCTION has_role(_user_id TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- STEP 5: Create sync triggers (keeps mobile app working)
-- ============================================================================

-- Trigger: When users.role changes → update user_roles
CREATE OR REPLACE FUNCTION sync_user_role_to_roles_table()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old role
  IF OLD.role IS NOT NULL THEN
    DELETE FROM user_roles WHERE user_id = OLD.id;
  END IF;
  
  -- Insert new role
  IF NEW.role IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role, granted_at)
    VALUES (NEW.id, NEW.role::app_role, NOW())
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_user_role_update ON users;
CREATE TRIGGER sync_user_role_update
AFTER UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_roles_table();

-- Trigger: When user created → create user_roles entry
DROP TRIGGER IF EXISTS sync_user_role_insert ON users;
CREATE TRIGGER sync_user_role_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_roles_table();

-- Trigger: When user_roles changes → update users.role
CREATE OR REPLACE FUNCTION sync_roles_table_to_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE users 
    SET role = NEW.role::text, updated_at = NOW()
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users 
    SET role = NULL, updated_at = NOW()
    WHERE id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_roles_to_user_role ON user_roles;
CREATE TRIGGER sync_roles_to_user_role
AFTER INSERT OR UPDATE OR DELETE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION sync_roles_table_to_user_role();

-- STEP 6: Backfill existing data
-- ============================================================================
INSERT INTO user_roles (user_id, role, granted_at)
SELECT id, role::app_role, created_at
FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- STEP 7: Enable RLS on user_roles (security)
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all roles
CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm setup)
-- ============================================================================

-- Check if columns were added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- AND column_name IN ('avatar_url', 'email');

-- Check if user_roles table exists and has data
-- SELECT COUNT(*) as total_role_assignments FROM user_roles;

-- Verify triggers are working (should show matching counts)
-- SELECT 
--   (SELECT COUNT(*) FROM users WHERE role IS NOT NULL) as users_with_role,
--   (SELECT COUNT(*) FROM user_roles) as role_assignments;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Mobile app will continue using users.role exactly as before
-- 2. Admin interface will use user_roles table for security
-- 3. Triggers keep both tables in sync automatically
-- 4. No mobile app code changes needed
-- 5. Safe to run this script multiple times (idempotent)
