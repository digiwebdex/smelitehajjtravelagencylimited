-- Create transactions table for complete payment logging
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  emi_installment_id UUID REFERENCES public.emi_installments(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL,
  gateway_name TEXT NOT NULL,
  transaction_id TEXT,
  gateway_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending',
  is_live_mode BOOLEAN NOT NULL DEFAULT false,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_logs table for debugging and audit
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  gateway TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_gateway ON public.transactions(gateway_name);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_payment_logs_transaction_id ON public.payment_logs(transaction_id);
CREATE INDEX idx_payment_logs_booking_id ON public.payment_logs(booking_id);
CREATE INDEX idx_payment_logs_gateway ON public.payment_logs(gateway);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = transactions.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view transactions by booking id"
  ON public.transactions FOR SELECT
  USING (true);

CREATE POLICY "Service can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for payment_logs
CREATE POLICY "Admins can manage all payment logs"
  ON public.payment_logs FOR ALL
  USING (is_admin());

CREATE POLICY "Service can insert payment logs"
  ON public.payment_logs FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger for transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();