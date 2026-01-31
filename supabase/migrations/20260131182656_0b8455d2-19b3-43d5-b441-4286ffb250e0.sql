
-- Create enum for air ticket booking status (check if exists first)
DO $$ BEGIN
  CREATE TYPE air_ticket_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for gender
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create air ticket bookings table
CREATE TABLE IF NOT EXISTS public.air_ticket_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE DEFAULT 'ATB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  user_id UUID REFERENCES auth.users(id),
  
  -- Flight Details
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  travel_date DATE NOT NULL,
  return_date DATE,
  is_round_trip BOOLEAN DEFAULT false,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  
  -- Contact Details
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+880',
  remarks TEXT,
  
  -- Admin Fields
  status air_ticket_status NOT NULL DEFAULT 'pending',
  pnr_number TEXT,
  ticket_number TEXT,
  price DECIMAL(12,2),
  admin_notes TEXT,
  rejection_reason TEXT,
  ticket_file_url TEXT,
  
  -- Guest booking support
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Audit
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create air ticket passengers table
CREATE TABLE IF NOT EXISTS public.air_ticket_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.air_ticket_bookings(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender gender_type NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL DEFAULT 'Bangladeshi',
  passport_number TEXT,
  passport_expiry DATE,
  frequent_flyer_number TEXT,
  special_service_request TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  sms_template TEXT,
  email_subject TEXT,
  email_template TEXT,
  is_active BOOLEAN DEFAULT true,
  variables TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booking settings table for CMS
CREATE TABLE IF NOT EXISTS public.booking_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.air_ticket_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.air_ticket_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for air_ticket_bookings
CREATE POLICY "air_ticket_bookings_select_own" ON public.air_ticket_bookings
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "air_ticket_bookings_insert" ON public.air_ticket_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "air_ticket_bookings_update_admin" ON public.air_ticket_bookings
  FOR UPDATE USING (is_admin());

CREATE POLICY "air_ticket_bookings_delete_admin" ON public.air_ticket_bookings
  FOR DELETE USING (is_admin());

-- RLS Policies for air_ticket_passengers
CREATE POLICY "air_ticket_passengers_select" ON public.air_ticket_passengers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.air_ticket_bookings atb
      WHERE atb.id = air_ticket_passengers.booking_id 
        AND (atb.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "air_ticket_passengers_insert" ON public.air_ticket_passengers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "air_ticket_passengers_update_admin" ON public.air_ticket_passengers
  FOR UPDATE USING (is_admin());

CREATE POLICY "air_ticket_passengers_delete_admin" ON public.air_ticket_passengers
  FOR DELETE USING (is_admin());

-- RLS Policies for notification_templates
CREATE POLICY "notification_templates_admin" ON public.notification_templates
  FOR ALL USING (is_admin());

CREATE POLICY "notification_templates_select" ON public.notification_templates
  FOR SELECT USING (is_active = true);

-- RLS Policies for booking_settings
CREATE POLICY "booking_settings_admin" ON public.booking_settings
  FOR ALL USING (is_admin());

CREATE POLICY "booking_settings_select" ON public.booking_settings
  FOR SELECT USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_air_ticket_bookings_updated_at
  BEFORE UPDATE ON public.air_ticket_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_air_ticket_passengers_updated_at
  BEFORE UPDATE ON public.air_ticket_passengers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON public.booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_air_ticket_bookings_user_id ON public.air_ticket_bookings(user_id);
CREATE INDEX idx_air_ticket_bookings_status ON public.air_ticket_bookings(status);
CREATE INDEX idx_air_ticket_bookings_booking_id ON public.air_ticket_bookings(booking_id);
CREATE INDEX idx_air_ticket_passengers_booking_id ON public.air_ticket_passengers(booking_id);
