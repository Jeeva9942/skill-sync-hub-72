-- Function to generate Gravatar URL from email
CREATE OR REPLACE FUNCTION public.generate_gravatar_url(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'https://www.gravatar.com/avatar/' || md5(lower(trim(email))) || '?d=identicon&s=200';
END;
$$;

-- Update the handle_new_user function to automatically set Gravatar avatar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'user_role')::public.user_role, 'client'),
    generate_gravatar_url(NEW.email)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Update existing users without avatars to use Gravatar
UPDATE public.profiles
SET avatar_url = generate_gravatar_url(email)
WHERE avatar_url IS NULL OR avatar_url = '';