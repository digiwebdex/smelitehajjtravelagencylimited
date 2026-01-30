-- Create leads table for lead management
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  package_id UUID REFERENCES public.packages(id),
  travel_month DATE,
  budget_range TEXT,
  passport_ready BOOLEAN DEFAULT false,
  group_size INTEGER DEFAULT 1,
  message TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  fbclid TEXT,
  ip_address TEXT,
  device_type TEXT,
  user_agent TEXT,
  lead_score INTEGER DEFAULT 0,
  lead_status TEXT DEFAULT 'New' CHECK (lead_status IN ('New', 'Contacted', 'Converted', 'Lost')),
  original_event_id TEXT,
  payment_value DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_event_logs table for API response logging
CREATE TABLE public.marketing_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  lead_id UUID REFERENCES public.leads(id),
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketing_settings table for extended configuration
CREATE TABLE public.marketing_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default marketing settings
INSERT INTO public.marketing_settings (setting_key, setting_value) VALUES
  ('general', '{"default_currency": "BDT", "default_lead_value": 50000, "pixel_enabled": true, "capi_enabled": true}'),
  ('recaptcha', '{"site_key": "", "secret_key": "", "enabled": false, "threshold": 0.3}');

-- Enable RLS on all new tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table (admin only)
CREATE POLICY "Admins can view all leads" 
ON public.leads 
FOR SELECT 
USING (public.is_admin() OR public.is_staff(auth.uid()));

CREATE POLICY "Admins can insert leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can update leads" 
ON public.leads 
FOR UPDATE 
USING (public.is_admin() OR public.is_staff(auth.uid()));

CREATE POLICY "Admins can delete leads" 
ON public.leads 
FOR DELETE 
USING (public.is_admin());

-- RLS Policies for marketing_event_logs (admin read, service role insert)
CREATE POLICY "Admins can view event logs" 
ON public.marketing_event_logs 
FOR SELECT 
USING (public.is_admin() OR public.is_staff(auth.uid()));

CREATE POLICY "Allow insert for event logs" 
ON public.marketing_event_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for marketing_settings (admin only)
CREATE POLICY "Admins can view marketing settings" 
ON public.marketing_settings 
FOR SELECT 
USING (public.is_admin() OR public.is_staff(auth.uid()));

CREATE POLICY "Admins can update marketing settings" 
ON public.marketing_settings 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Public can read marketing settings for forms" 
ON public.marketing_settings 
FOR SELECT 
USING (true);

-- Create trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on marketing_settings
CREATE TRIGGER update_marketing_settings_updated_at
BEFORE UPDATE ON public.marketing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_utm_source ON public.leads(utm_source);
CREATE INDEX idx_event_logs_event_id ON public.marketing_event_logs(event_id);
CREATE INDEX idx_event_logs_created_at ON public.marketing_event_logs(created_at DESC);