-- Add availability status and last active timestamp to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline')),
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- Add required_skills and duration to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS required_skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS duration text;

-- Update bids table to have proper proposal status
ALTER TABLE public.bids
DROP CONSTRAINT IF EXISTS bids_status_check;

ALTER TABLE public.bids
ADD CONSTRAINT bids_status_check CHECK (status IN ('sent', 'viewed', 'shortlisted', 'pending', 'accepted', 'rejected'));

-- Create shortlists table for clients to shortlist freelancers
CREATE TABLE IF NOT EXISTS public.shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  notes text,
  status text DEFAULT 'shortlisted' CHECK (status IN ('shortlisted', 'hired', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(client_id, freelancer_id, project_id)
);

-- Enable RLS on shortlists
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shortlists
CREATE POLICY "Clients can view their own shortlists"
ON public.shortlists FOR SELECT
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create shortlists"
ON public.shortlists FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own shortlists"
ON public.shortlists FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their own shortlists"
ON public.shortlists FOR DELETE
USING (auth.uid() = client_id);

-- Create interviews table for interview scheduling
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  freelancer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  shortlist_id uuid REFERENCES public.shortlists(id) ON DELETE CASCADE,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 30,
  meeting_link text,
  notes text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on interviews
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interviews
CREATE POLICY "Users can view their own interviews"
ON public.interviews FOR SELECT
USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

CREATE POLICY "Clients can create interviews"
ON public.interviews FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their interviews"
ON public.interviews FOR UPDATE
USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete their interviews"
ON public.interviews FOR DELETE
USING (auth.uid() = client_id);

-- Create trigger for updating updated_at on shortlists
CREATE OR REPLACE TRIGGER update_shortlists_updated_at
BEFORE UPDATE ON public.shortlists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updating updated_at on interviews
CREATE OR REPLACE TRIGGER update_interviews_updated_at
BEFORE UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Update the profile last_active_at when user interacts
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;