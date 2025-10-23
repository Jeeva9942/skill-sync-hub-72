-- Allow clients to delete their own projects
CREATE POLICY "Clients can delete own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = client_id);