-- Create trip type enum
DO $$ BEGIN
  CREATE TYPE trip_type AS ENUM ('one_way', 'round_trip', 'multi_city');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create cabin class enum
DO $$ BEGIN
  CREATE TYPE cabin_class AS ENUM ('economy', 'premium_economy', 'business', 'first');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to air_ticket_bookings if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'air_ticket_bookings' AND column_name = 'trip_type') THEN
    ALTER TABLE air_ticket_bookings ADD COLUMN trip_type trip_type DEFAULT 'one_way';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'air_ticket_bookings' AND column_name = 'cabin_class') THEN
    ALTER TABLE air_ticket_bookings ADD COLUMN cabin_class cabin_class DEFAULT 'economy';
  END IF;
END $$;

-- Create multi-city routes table if not exists
CREATE TABLE IF NOT EXISTS air_ticket_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES air_ticket_bookings(id) ON DELETE CASCADE NOT NULL,
  route_order INT NOT NULL,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  travel_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'air_ticket_routes_booking_id_route_order_key') THEN
    ALTER TABLE air_ticket_routes ADD CONSTRAINT air_ticket_routes_booking_id_route_order_key UNIQUE(booking_id, route_order);
  END IF;
END $$;

-- Create air ticket settings table for CMS
CREATE TABLE IF NOT EXISTS air_ticket_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE air_ticket_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE air_ticket_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own routes" ON air_ticket_routes;
DROP POLICY IF EXISTS "Users can insert routes for their bookings" ON air_ticket_routes;
DROP POLICY IF EXISTS "Admin full access to routes" ON air_ticket_routes;
DROP POLICY IF EXISTS "Anyone can read air ticket settings" ON air_ticket_settings;
DROP POLICY IF EXISTS "Admin can manage settings" ON air_ticket_settings;
DROP POLICY IF EXISTS "Allow public insert routes" ON air_ticket_routes;

-- RLS policies for routes - allow public insert for guest bookings
CREATE POLICY "Allow public insert routes"
  ON air_ticket_routes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own routes"
  ON air_ticket_routes FOR SELECT
  USING (true);

CREATE POLICY "Admin full access to routes"
  ON air_ticket_routes FOR ALL
  USING (is_admin());

-- RLS for settings - public read, admin write
CREATE POLICY "Anyone can read air ticket settings"
  ON air_ticket_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage settings"
  ON air_ticket_settings FOR ALL
  USING (is_admin());

-- Insert default settings (upsert to avoid duplicates)
INSERT INTO air_ticket_settings (setting_key, setting_value, description) VALUES
('trip_types', '{"one_way": true, "round_trip": true, "multi_city": true}', 'Enable/disable trip types'),
('max_multi_city_routes', '4', 'Maximum number of routes for multi-city'),
('cabin_classes', '{"economy": true, "premium_economy": true, "business": true, "first": true}', 'Enable/disable cabin classes'),
('confirmation_message', '"Our team is checking availability. We will contact you shortly with the best options."', 'Message shown after booking submission'),
('section_title', '"Book Your Air Ticket"', 'Section title'),
('section_subtitle', '"Affordable air tickets to destinations worldwide with trusted airlines"', 'Section subtitle')
ON CONFLICT (setting_key) DO NOTHING;

-- Create triggers for updated_at if not exist
DROP TRIGGER IF EXISTS update_air_ticket_routes_updated_at ON air_ticket_routes;
CREATE TRIGGER update_air_ticket_routes_updated_at
  BEFORE UPDATE ON air_ticket_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_air_ticket_settings_updated_at ON air_ticket_settings;
CREATE TRIGGER update_air_ticket_settings_updated_at
  BEFORE UPDATE ON air_ticket_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();