-- Create admin user directly in auth.users
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'skillsyncadmin@gmail.com';
  admin_password text := 'skillsyncadmin';
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- If admin doesn't exist, we'll create them via the profiles insert
  -- which will be handled by the trigger
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the admin
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users (simplified - you'll need to sign up normally first time)
    -- Note: Password hashing must be done by Supabase auth system
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin User","user_role":"client"}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, user_role)
    VALUES (admin_user_id, admin_email, 'Admin User', 'client')
    ON CONFLICT (id) DO NOTHING;

    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- User exists, just ensure they have admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;