-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow EMI installment creation for bookings" ON public.emi_installments;

-- Create a secure policy that allows inserts when the emi_payment exists
-- We use a separate check that will work even with eventual consistency
CREATE POLICY "Allow EMI installment creation with valid payment" 
ON public.emi_installments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.emi_payments 
    WHERE emi_payments.id = emi_installments.emi_payment_id
  )
);