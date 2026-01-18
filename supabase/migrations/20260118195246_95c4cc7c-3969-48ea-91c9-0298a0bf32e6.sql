-- Create gallery_settings table for admin customization
CREATE TABLE public.gallery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Our Gallery',
  subtitle TEXT DEFAULT 'Capturing beautiful moments from our sacred journeys',
  background_color TEXT DEFAULT '#f8fafc',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gallery_images table for storing gallery images
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.gallery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Public read access for gallery_settings
CREATE POLICY "Gallery settings are publicly readable"
ON public.gallery_settings
FOR SELECT
USING (true);

-- Admin write access for gallery_settings
CREATE POLICY "Admins can manage gallery settings"
ON public.gallery_settings
FOR ALL
USING (public.is_admin());

-- Public read access for active gallery images
CREATE POLICY "Active gallery images are publicly readable"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

-- Admin full access for gallery images
CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images
FOR ALL
USING (public.is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_gallery_settings_updated_at
BEFORE UPDATE ON public.gallery_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default gallery settings
INSERT INTO public.gallery_settings (title, subtitle, is_enabled)
VALUES ('Our Gallery', 'Capturing beautiful moments from our sacred journeys', true);