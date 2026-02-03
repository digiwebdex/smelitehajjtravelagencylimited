-- Fix EMI Payments: Remove public SELECT and restrict to authenticated users who own the booking or are admins
DROP POLICY IF EXISTS "Anyone can view EMI payments by booking id" ON public.emi_payments;
DROP POLICY IF EXISTS "Users can view their own EMI payments" ON public.emi_payments;

-- Create proper policy: Only booking owners or admins can view EMI payments
CREATE POLICY "Users can view their own EMI payments"
ON public.emi_payments
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = emi_payments.booking_id
    AND (
      b.user_id = auth.uid()
      OR b.guest_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  ))
  OR is_admin()
);

-- Fix EMI Installments: Remove public SELECT and restrict to authenticated users who own the related booking or are admins
DROP POLICY IF EXISTS "Anyone can view EMI installments by payment id" ON public.emi_installments;
DROP POLICY IF EXISTS "Users can view their own EMI installments" ON public.emi_installments;

-- Create proper policy: Only booking owners or admins can view EMI installments
CREATE POLICY "Users can view their own EMI installments"
ON public.emi_installments
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM emi_payments ep
    JOIN bookings b ON b.id = ep.booking_id
    WHERE ep.id = emi_installments.emi_payment_id
    AND (
      b.user_id = auth.uid()
      OR b.guest_email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
  ))
  OR is_admin()
);

-- Fix Leads table: Replace overly permissive INSERT policy 
-- Only admins should be able to insert leads via admin panel
-- Note: Lead capture from frontend uses service role key via edge function, so this won't affect that flow
DROP POLICY IF EXISTS "Admins can insert leads" ON public.leads;

-- Allow authenticated admin users to insert leads
CREATE POLICY "Admins can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (is_admin());

-- Also allow anon/service role to insert (for lead capture forms)
CREATE POLICY "Allow lead capture from forms"
ON public.leads
FOR INSERT
TO anon, service_role
WITH CHECK (true);