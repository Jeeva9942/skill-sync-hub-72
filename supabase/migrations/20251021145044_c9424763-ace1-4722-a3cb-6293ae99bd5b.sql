-- Fix search_path for generate_gravatar_url function
CREATE OR REPLACE FUNCTION public.generate_gravatar_url(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'https://www.gravatar.com/avatar/' || md5(lower(trim(email))) || '?d=identicon&s=200';
END;
$$;