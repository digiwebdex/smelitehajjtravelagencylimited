-- Add a SELECT policy for emi_payments that allows anyone to view EMI payments by booking ID
-- This is needed for the emi_installments INSERT policy to work (it checks if emi_payment exists)
CREATE POLICY "Anyone can view EMI payments by booking id" 
ON public.emi_payments 
FOR SELECT 
USING (true);

-- Update emi_installments SELECT policy to also allow viewing by booking context
CREATE POLICY "Anyone can view EMI installments by payment id" 
ON public.emi_installments 
FOR SELECT 
USING (true);