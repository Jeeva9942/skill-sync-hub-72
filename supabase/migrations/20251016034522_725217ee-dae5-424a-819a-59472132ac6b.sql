-- Create enum types
CREATE TYPE public.user_role AS ENUM ('client', 'freelancer');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.project_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.project_category AS ENUM ('web_development', 'mobile_development', 'design', 'writing', 'marketing', 'data_science', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  user_role public.user_role NOT NULL DEFAULT 'client',
  bio TEXT,
  skills TEXT[],
  hourly_rate DECIMAL(10, 2),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for admin access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.project_category NOT NULL,
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  deadline DATE,
  status public.project_status DEFAULT 'open',
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  proposal TEXT NOT NULL,
  delivery_days INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "User roles viewable by admins"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Projects policies
CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Clients can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all projects"
  ON public.projects FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Bids policies
CREATE POLICY "Bids viewable by project owner and bidder"
  ON public.bids FOR SELECT
  USING (
    auth.uid() = freelancer_id OR
    auth.uid() IN (SELECT client_id FROM public.projects WHERE id = project_id) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Freelancers can create bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = freelancer_id);

-- Reviews policies
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed projects"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'user_role')::public.user_role, 'client')
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();