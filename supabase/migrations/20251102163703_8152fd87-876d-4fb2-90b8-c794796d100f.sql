-- Create a function to assign admin role to the admin email
CREATE OR REPLACE FUNCTION assign_admin_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Execute the function
SELECT assign_admin_role();

-- Create a trigger to automatically assign admin role when the admin user signs up
CREATE OR REPLACE FUNCTION auto_assign_admin_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;
CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_admin_on_signup();