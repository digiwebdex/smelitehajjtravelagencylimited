-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Anyone can view enabled payment methods" ON public.payment_methods;

-- Create a new SELECT policy that allows admins to view all, and public to view only enabled
CREATE POLICY "Admins can view all payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Public can view enabled payment methods" 
ON public.payment_methods 
FOR SELECT 
USING (is_enabled = true);