INSERT INTO public.memberships (user_id, organization_id, role)
VALUES (
  'bdcde7e9-c830-4b7b-9ea1-0892ffd3cff0',
  'd3751758-bf07-4bbe-a78b-661ae87f1f32',
  'owner'
)
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'owner';