
-- Assign admin role to all existing users who don't have a role yet
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.users.id)
ON CONFLICT DO NOTHING;
