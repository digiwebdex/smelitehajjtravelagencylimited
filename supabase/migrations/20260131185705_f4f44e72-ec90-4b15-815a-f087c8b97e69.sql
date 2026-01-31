-- Create hotels table
CREATE TABLE public.hotels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('makkah', 'madinah')),
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  distance_from_haram INTEGER NOT NULL, -- in meters
  description TEXT,
  facilities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  google_map_link TEXT,
  google_map_embed_url TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotel booking requests table
CREATE TABLE public.hotel_booking_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+880',
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  room_count INTEGER DEFAULT 1,
  adult_count INTEGER DEFAULT 1,
  child_count INTEGER DEFAULT 0,
  special_requests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotel section settings table
CREATE TABLE public.hotel_section_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT,
  subtitle TEXT,
  is_enabled BOOLEAN DEFAULT true,
  booking_enabled BOOLEAN DEFAULT true,
  star_label TEXT DEFAULT 'Star',
  sort_by TEXT DEFAULT 'order_index' CHECK (sort_by IN ('order_index', 'distance', 'rating', 'name')),
  sort_order TEXT DEFAULT 'asc' CHECK (sort_order IN ('asc', 'desc')),
  hotels_per_page INTEGER DEFAULT 12,
  show_map_button BOOLEAN DEFAULT true,
  show_details_button BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_section_settings ENABLE ROW LEVEL SECURITY;

-- Hotels policies (public read, admin write)
CREATE POLICY "Hotels are viewable by everyone"
  ON public.hotels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hotels"
  ON public.hotels FOR ALL
  USING (public.is_admin());

-- Hotel booking requests policies
CREATE POLICY "Users can view their own booking requests"
  ON public.hotel_booking_requests FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Anyone can create booking requests"
  ON public.hotel_booking_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all booking requests"
  ON public.hotel_booking_requests FOR ALL
  USING (public.is_admin());

-- Hotel section settings policies (public read, admin write)
CREATE POLICY "Hotel settings are viewable by everyone"
  ON public.hotel_section_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hotel settings"
  ON public.hotel_section_settings FOR ALL
  USING (public.is_admin());

-- Create updated_at triggers
CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotel_booking_requests_updated_at
  BEFORE UPDATE ON public.hotel_booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotel_section_settings_updated_at
  BEFORE UPDATE ON public.hotel_section_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default section settings
INSERT INTO public.hotel_section_settings (section_key, title, subtitle)
VALUES 
  ('makkah', 'Makkah Hotels', 'Premium accommodations near Masjid al-Haram'),
  ('madinah', 'Madinah Hotels', 'Comfortable stays near Masjid an-Nabawi'),
  ('general', 'Hotel Bookings', 'Find your perfect stay for Umrah');

-- Create index for performance
CREATE INDEX idx_hotels_city ON public.hotels(city);
CREATE INDEX idx_hotels_active ON public.hotels(is_active);
CREATE INDEX idx_hotel_booking_requests_status ON public.hotel_booking_requests(status);
CREATE INDEX idx_hotel_booking_requests_user ON public.hotel_booking_requests(user_id);