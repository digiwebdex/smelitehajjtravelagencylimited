
-- Create customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  passport_number text,
  nationality text DEFAULT 'Bangladeshi',
  date_of_birth date,
  gender text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  notes text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer_documents table
CREATE TABLE public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  notes text,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Staff can view all customers" ON public.customers FOR SELECT USING (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can insert customers" ON public.customers FOR INSERT WITH CHECK (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can update customers" ON public.customers FOR UPDATE USING (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can delete customers" ON public.customers FOR DELETE USING (is_admin());
CREATE POLICY "Auto-insert from bookings" ON public.customers FOR INSERT WITH CHECK (true);

-- RLS policies for customer_documents
CREATE POLICY "Staff can view customer docs" ON public.customer_documents FOR SELECT USING (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can upload customer docs" ON public.customer_documents FOR INSERT WITH CHECK (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can update customer docs" ON public.customer_documents FOR UPDATE USING (is_staff(auth.uid()) OR is_admin());
CREATE POLICY "Staff can delete customer docs" ON public.customer_documents FOR DELETE USING (is_admin());

-- Create storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for customer-documents bucket
CREATE POLICY "Staff can upload customer documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'customer-documents' AND (is_staff(auth.uid()) OR is_admin()));
CREATE POLICY "Staff can view customer documents" ON storage.objects FOR SELECT USING (bucket_id = 'customer-documents' AND (is_staff(auth.uid()) OR is_admin()));
CREATE POLICY "Admin can delete customer documents" ON storage.objects FOR DELETE USING (bucket_id = 'customer-documents' AND is_admin());

-- Trigger function to auto-create customer from booking
CREATE OR REPLACE FUNCTION public.create_customer_from_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if customer already exists for this booking
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE booking_id = NEW.id) THEN
    INSERT INTO public.customers (booking_id, user_id, full_name, email, phone)
    VALUES (
      NEW.id,
      NEW.user_id,
      COALESCE(NEW.guest_name, 'Customer'),
      NEW.guest_email,
      NEW.guest_phone
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
CREATE TRIGGER on_booking_create_customer
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_from_booking();

-- Updated_at trigger for customers
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for customer_documents
CREATE TRIGGER update_customer_documents_updated_at
  BEFORE UPDATE ON public.customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
