-- Create function to check if user is admin or viewer (for admin panel access)
CREATE OR REPLACE FUNCTION public.is_admin_or_viewer()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'viewer')
  )
$$;