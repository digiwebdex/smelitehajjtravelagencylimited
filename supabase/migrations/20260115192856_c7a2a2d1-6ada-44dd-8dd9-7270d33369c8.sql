-- Create notification_settings table to store SMS and Email configuration
CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('sms', 'email')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(setting_type)
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage notification settings
CREATE POLICY "Admins can view notification settings"
ON public.notification_settings
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert notification settings"
ON public.notification_settings
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update notification settings"
ON public.notification_settings
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete notification settings"
ON public.notification_settings
FOR DELETE
USING (public.is_admin());

-- Create trigger for updating updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.notification_settings (setting_type, is_enabled, config)
VALUES 
  ('sms', false, '{"provider": "bulk_sms", "api_url": "", "api_key": "", "sender_id": ""}'),
  ('email', false, '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_password": "", "from_email": "", "from_name": ""}');

-- Create notification_logs table to track sent notifications
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('sms', 'email')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view notification logs
CREATE POLICY "Admins can view notification logs"
ON public.notification_logs
FOR SELECT
USING (public.is_admin());

-- Service role can insert logs (from edge functions)
CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);