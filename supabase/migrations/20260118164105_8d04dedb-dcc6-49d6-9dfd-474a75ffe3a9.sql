-- Add order_index column to hero_content table for slider ordering
ALTER TABLE public.hero_content 
ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- Add slide_type column to categorize slides (general, hajj, umrah)
ALTER TABLE public.hero_content 
ADD COLUMN IF NOT EXISTS slide_type text NOT NULL DEFAULT 'general';

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_hero_content_order ON public.hero_content (order_index);

-- Insert default Hajj slide
INSERT INTO public.hero_content (
  badge_text,
  title,
  subtitle,
  description,
  primary_button_text,
  primary_button_link,
  secondary_button_text,
  secondary_button_link,
  slide_type,
  order_index,
  is_active
) VALUES (
  'Premium Hajj Packages 2025',
  'Experience the Sacred',
  'Hajj Pilgrimage',
  'Join thousands of pilgrims on the journey of a lifetime. Our comprehensive Hajj packages ensure a spiritually fulfilling experience.',
  'View Hajj Packages',
  '#hajj',
  'Contact Us',
  '#contact',
  'hajj',
  1,
  true
) ON CONFLICT DO NOTHING;

-- Insert default Umrah slide
INSERT INTO public.hero_content (
  badge_text,
  title,
  subtitle,
  description,
  primary_button_text,
  primary_button_link,
  secondary_button_text,
  secondary_button_link,
  slide_type,
  order_index,
  is_active
) VALUES (
  'Year-Round Umrah Packages',
  'Embark on Your',
  'Umrah Journey',
  'Perform Umrah any time of the year with our flexible packages. Experience the blessings of visiting the holy sites.',
  'View Umrah Packages',
  '#umrah',
  'Learn More',
  '#services',
  'umrah',
  2,
  true
) ON CONFLICT DO NOTHING;