-- Create enums for booking status and package type
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.package_type AS ENUM ('hajj', 'umrah');
CREATE TYPE public.user_role AS ENUM ('customer', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create packages table
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type package_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  includes TEXT[],
  hotel_rating INTEGER DEFAULT 5,
  stock INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  status booking_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  passenger_details JSONB,
  travel_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to set total_price from package price (prevents price manipulation)
CREATE OR REPLACE FUNCTION public.set_booking_total_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  package_price DECIMAL(10,2);
BEGIN
  SELECT price INTO package_price FROM public.packages WHERE id = NEW.package_id;
  NEW.total_price = package_price * NEW.passenger_count;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_price
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_total_price();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- RLS Policies for packages
CREATE POLICY "Anyone can view active packages"
  ON public.packages FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can insert packages"
  ON public.packages FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update packages"
  ON public.packages FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete packages"
  ON public.packages FOR DELETE
  USING (public.is_admin());

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin());

-- Insert sample packages
INSERT INTO public.packages (title, description, type, price, duration_days, includes, hotel_rating, stock) VALUES
('Economy Hajj Package', 'Affordable Hajj package with 3-star accommodations near Haram', 'hajj', 4500.00, 21, ARRAY['Round-trip flights', '3-star hotel in Makkah', '3-star hotel in Madinah', 'Ground transportation', 'Visa processing', 'Guided tours'], 3, 50),
('Deluxe Hajj Package', 'Premium Hajj experience with 4-star hotels and special amenities', 'hajj', 6500.00, 21, ARRAY['Round-trip flights', '4-star hotel in Makkah', '4-star hotel in Madinah', 'VIP ground transportation', 'Visa processing', 'Guided tours', 'Ziyarat trips', 'Daily meals'], 4, 30),
('VIP Hajj Package', 'Luxury Hajj with 5-star hotels and exclusive services', 'hajj', 9500.00, 25, ARRAY['Business class flights', '5-star hotel in Makkah (Haram view)', '5-star hotel in Madinah', 'Private transportation', 'Visa processing', 'Personal guide', 'All Ziyarat trips', 'Full board meals', 'Luxury tent in Mina'], 5, 20),
('Economy Umrah Package', 'Budget-friendly Umrah with essential services', 'umrah', 1500.00, 10, ARRAY['Round-trip flights', '3-star hotel', 'Airport transfers', 'Visa processing'], 3, 100),
('Ramadan Umrah Package', 'Special Ramadan Umrah with spiritual focus', 'umrah', 2500.00, 14, ARRAY['Round-trip flights', '4-star hotel near Haram', 'Ground transportation', 'Visa processing', 'Iftar arrangements', 'Guided tours'], 4, 50),
('VIP Umrah Package', 'Premium Umrah experience with luxury accommodations', 'umrah', 4000.00, 12, ARRAY['Business class flights', '5-star hotel (Haram view)', 'Private transportation', 'Visa processing', 'Personal guide', 'All Ziyarat trips', 'Full board meals'], 5, 30);

-- Create indexes for better query performance
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX idx_packages_type ON public.packages(type);
CREATE INDEX idx_packages_is_active ON public.packages(is_active);