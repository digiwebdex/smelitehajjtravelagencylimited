
-- Clean up duplicate triggers (keep our new consistently-named ones)
DROP TRIGGER IF EXISTS set_booking_price ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_create_customer ON public.bookings;
