-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT NOT NULL DEFAULT 'CreditCard',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_live_mode BOOLEAN NOT NULL DEFAULT false,
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view enabled payment methods" 
ON public.payment_methods 
FOR SELECT 
USING ((is_enabled = true) OR is_admin());

CREATE POLICY "Admins can insert payment methods" 
ON public.payment_methods 
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can update payment methods" 
ON public.payment_methods 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete payment methods" 
ON public.payment_methods 
FOR DELETE 
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, slug, icon_name, description, order_index) VALUES
('SSLCommerz', 'sslcommerz', 'CreditCard', 'Pay securely with credit/debit card via SSLCommerz', 1),
('bKash', 'bkash', 'Smartphone', 'Pay with bKash mobile wallet', 2),
('Nagad', 'nagad', 'Wallet', 'Pay with Nagad mobile wallet', 3),
('Cash Payment', 'cash', 'Banknote', 'Pay in cash at our office', 4);

-- Add payment_method column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payment_method TEXT,
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN transaction_id TEXT;