-- Create site_settings table for storing all configurable site settings
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings (for displaying on frontend)
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can insert settings
CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (is_admin());

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Only admins can delete settings
CREATE POLICY "Admins can delete site settings" 
ON public.site_settings 
FOR DELETE 
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value, category) VALUES
  ('company_info', '{"name": "SM Elite Hajj", "tagline": "Your Trusted Partner for Sacred Journeys", "description": "Government Approved Hajj & Umrah Agency", "logo_url": ""}', 'general'),
  ('contact_details', '{"email": "info@smelitehajj.com", "phone": "+880 1234-567890", "whatsapp": "+8801712345678", "address": "Dhaka, Bangladesh"}', 'general'),
  ('social_links', '{"facebook": "", "instagram": "", "youtube": "", "twitter": ""}', 'general'),
  ('appearance', '{"primary_color": "#10b981", "show_announcement_bar": false, "announcement_text": ""}', 'appearance');