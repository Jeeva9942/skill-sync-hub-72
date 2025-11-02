-- Fix security issues by setting search_path on the functions

-- Update assign_admin_role function with search_path
CREATE OR REPLACE FUNCTION assign_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Find the user ID for skillsyncadmin@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'skillsyncadmin@gmail.com'
  LIMIT 1;

  -- If user exists, ensure they have admin role
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Update auto_assign_admin_on_signup function with search_path
CREATE OR REPLACE FUNCTION auto_assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'skillsyncadmin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;