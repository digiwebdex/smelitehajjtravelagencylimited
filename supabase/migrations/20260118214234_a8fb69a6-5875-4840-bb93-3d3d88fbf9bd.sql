-- Create about_content table for managing the About section
CREATE TABLE public.about_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'About Us',
  subtitle TEXT,
  mission_title TEXT DEFAULT 'Our Mission',
  mission_text TEXT,
  history_title TEXT DEFAULT 'Our History',
  history_text TEXT,
  vision_title TEXT DEFAULT 'Our Vision',
  vision_text TEXT,
  values_title TEXT DEFAULT 'Our Values',
  values_items JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  stats JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view about content" ON public.about_content
  FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admins can manage about content" ON public.about_content
  FOR ALL USING (public.is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_about_content_updated_at
  BEFORE UPDATE ON public.about_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content
INSERT INTO public.about_content (
  title,
  subtitle,
  mission_title,
  mission_text,
  history_title,
  history_text,
  vision_title,
  vision_text,
  values_title,
  values_items,
  stats
) VALUES (
  'About SM Elite Hajj',
  'Your Trusted Partner for Sacred Journeys',
  'Our Mission',
  'To provide exceptional Hajj and Umrah services that enable Muslims to fulfill their religious obligations with comfort, dignity, and spiritual fulfillment.',
  'Our History',
  'Founded with a vision to serve pilgrims, SM Elite Hajj has been helping Muslims embark on their sacred journeys for over a decade. Our commitment to excellence and personalized service has made us a trusted name in religious travel.',
  'Our Vision',
  'To be the most trusted and preferred Hajj and Umrah service provider, known for our dedication to pilgrim welfare and spiritual guidance.',
  'Our Values',
  '[{"title": "Trust", "description": "Building lasting relationships through transparency and reliability"}, {"title": "Excellence", "description": "Delivering the highest quality service in every aspect"}, {"title": "Compassion", "description": "Understanding and caring for each pilgrim''s unique needs"}, {"title": "Integrity", "description": "Upholding ethical standards in all our dealings"}]'::jsonb,
  '[{"value": "10+", "label": "Years Experience"}, {"value": "5000+", "label": "Happy Pilgrims"}, {"value": "100%", "label": "Success Rate"}, {"value": "24/7", "label": "Support"}]'::jsonb
);

-- Add about section to section_settings if not exists
INSERT INTO public.section_settings (section_key, title, subtitle, is_active, order_index)
VALUES ('about', 'About Us', 'Learn more about our journey', true, 2)
ON CONFLICT (section_key) DO NOTHING;