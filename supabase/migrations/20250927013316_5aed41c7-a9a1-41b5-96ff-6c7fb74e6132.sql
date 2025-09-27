-- Grant platform admin access to joe@bizooma.com
UPDATE profiles SET is_platform_admin = true WHERE user_id = 'bdcde7e9-c830-4b7b-9ea1-0892ffd3cff0';

INSERT INTO platform_roles (user_id, role, granted_by) 
VALUES ('bdcde7e9-c830-4b7b-9ea1-0892ffd3cff0', 'platform_admin', 'bdcde7e9-c830-4b7b-9ea1-0892ffd3cff0')
ON CONFLICT (user_id, role) DO NOTHING;