-- Allow anyone to INSERT EMI payments when a booking exists (for guest bookings)
CREATE POLICY "Allow EMI payment creation for bookings" 
ON public.emi_payments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = emi_payments.booking_id
  )
);

-- Allow anyone to INSERT EMI installments when an EMI payment exists (for guest bookings)
CREATE POLICY "Allow EMI installment creation" 
ON public.emi_installments 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.emi_payments 
    WHERE emi_payments.id = emi_installments.emi_payment_id
  )
);