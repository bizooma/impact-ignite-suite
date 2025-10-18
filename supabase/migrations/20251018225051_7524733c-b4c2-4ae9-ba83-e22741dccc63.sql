-- Transfer MA1MNQR8D from Bizooma to Cal Farley's Boys Ranch
DO $$
DECLARE
  new_org_id uuid;
  dan_user_id uuid;
BEGIN
  -- Step 1: Create Cal Farley's Boys Ranch organization WITHOUT mobile_app_code first
  INSERT INTO public.organizations (
    name, 
    slug, 
    has_mobile_app,
    description
  )
  VALUES (
    'Cal Farley''s Boys Ranch',
    'cal-farleys-boys-ranch',
    true,
    'Cal Farley''s Boys Ranch - RanchVoice Mobile App'
  )
  RETURNING id INTO new_org_id;

  RAISE NOTICE 'Created Cal Farley organization with ID: %', new_org_id;

  -- Step 2: Remove mobile_app_code from Bizooma and mark has_mobile_app as false
  UPDATE public.organizations
  SET 
    mobile_app_code = NULL,
    has_mobile_app = false,
    updated_at = now()
  WHERE id = 'e16eaa0d-a6c3-4ee1-ae47-e4ef53a850d0';

  RAISE NOTICE 'Removed mobile app from Bizooma organization';

  -- Step 3: Add mobile_app_code to Cal Farley's organization
  UPDATE public.organizations
  SET mobile_app_code = 'MA1MNQR8D'
  WHERE id = new_org_id;

  RAISE NOTICE 'Assigned mobile app code to Cal Farley organization';

  -- Step 4: Re-link RanchVoice Mobile App Database to new organization
  UPDATE public.mobile_app_databases
  SET 
    organization_id = new_org_id,
    updated_at = now()
  WHERE organization_code = 'MA1MNQR8D';

  RAISE NOTICE 'Linked mobile app database to Cal Farley organization';

  -- Step 5: Get Dan's user_id from auth.users
  SELECT id INTO dan_user_id
  FROM auth.users
  WHERE email = 'dpectol@calfarley.org';

  -- Step 6: Create membership if Dan's account exists
  IF dan_user_id IS NOT NULL THEN
    INSERT INTO public.memberships (
      user_id, 
      organization_id, 
      role
    )
    VALUES (
      dan_user_id,
      new_org_id,
      'owner'
    );
    RAISE NOTICE 'Created owner membership for Dan Pectol';
  ELSE
    RAISE NOTICE 'WARNING: Dan Pectol user account (dpectol@calfarley.org) not found in auth.users';
    RAISE NOTICE 'Next step: Create Dan auth account manually, then add membership';
  END IF;

  RAISE NOTICE '=== Setup Complete ===';
  RAISE NOTICE 'Organization ID: %', new_org_id;
  RAISE NOTICE 'Next: Create Dan mobile app user via web interface';
END $$;