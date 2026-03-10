-- ============================================================
-- SM Elite Hajj - Complete Database Schema
-- Generated for self-hosted PostgreSQL migration
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE public.air_ticket_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.cabin_class AS ENUM ('economy', 'premium_economy', 'business', 'first');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE public.package_type AS ENUM ('hajj', 'umrah');
CREATE TYPE public.staff_role AS ENUM ('admin', 'manager', 'agent', 'support');
CREATE TYPE public.tracking_status AS ENUM ('order_submitted', 'documents_received', 'under_review', 'approved', 'processing', 'completed');
CREATE TYPE public.trip_type AS ENUM ('one_way', 'round_trip', 'multi_city');
CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'viewer');

-- ============================================================
-- TABLES (ordered by dependency)
-- ============================================================

-- Users table (replaces auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email_confirmed_at TIMESTAMPTZ,
  raw_user_meta_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenants
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role public.user_role DEFAULT 'customer',
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Members
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  staff_name TEXT,
  role public.staff_role DEFAULT 'support',
  department TEXT,
  employee_id TEXT,
  phone TEXT,
  mobile_number TEXT,
  address TEXT,
  hire_date TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff Activity Log
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES public.staff_members(id),
  user_id UUID,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  booking_ref TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packages
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  full_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_days INTEGER DEFAULT 1,
  type public.package_type NOT NULL,
  category TEXT,
  image_url TEXT,
  includes TEXT[],
  exclusions TEXT[],
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  hotel_type TEXT,
  hotel_rating INTEGER,
  hotel_image_url TEXT,
  hotel_images TEXT[],
  hotel_map_link TEXT,
  flight_type TEXT,
  transport_type TEXT,
  special_notes TEXT,
  pdf_url TEXT,
  installment_enabled BOOLEAN DEFAULT false,
  min_down_payment_percent INTEGER,
  max_installment_months INTEGER,
  show_book_now BOOLEAN DEFAULT true,
  show_view_details BOOLEAN DEFAULT true,
  countdown_end_date TEXT,
  weekly_bookings INTEGER DEFAULT 0,
  tenant_id UUID REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  package_id UUID NOT NULL REFERENCES public.packages(id),
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  passenger_count INTEGER DEFAULT 1,
  passenger_details JSONB,
  total_price DECIMAL(10,2) NOT NULL,
  status public.booking_status DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  payment_method TEXT,
  transaction_id TEXT,
  tracking_status public.tracking_status DEFAULT 'order_submitted',
  travel_date TEXT,
  notes TEXT,
  admin_notes TEXT,
  bank_transaction_number TEXT,
  bank_transfer_screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Status History
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  previous_status public.tracking_status,
  new_status public.tracking_status NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Documents
CREATE TABLE IF NOT EXISTS public.booking_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Settings
CREATE TABLE IF NOT EXISTS public.booking_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  booking_id UUID REFERENCES public.bookings(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth TEXT,
  gender TEXT,
  nationality TEXT,
  passport_number TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer Documents
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  notes TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMI Payments
CREATE TABLE IF NOT EXISTS public.emi_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  total_amount DECIMAL(10,2) NOT NULL,
  advance_amount DECIMAL(10,2) DEFAULT 0,
  emi_amount DECIMAL(10,2) NOT NULL,
  number_of_emis INTEGER NOT NULL,
  paid_emis INTEGER DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  is_emi_plan BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMI Installments
CREATE TABLE IF NOT EXISTS public.emi_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emi_payment_id UUID NOT NULL REFERENCES public.emi_payments(id),
  installment_number INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date TEXT,
  paid_date TEXT,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id),
  emi_installment_id UUID REFERENCES public.emi_installments(id),
  transaction_id TEXT,
  gateway_transaction_id TEXT,
  gateway_name TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BDT',
  status TEXT DEFAULT 'pending',
  is_live_mode BOOLEAN DEFAULT false,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'CreditCard',
  is_enabled BOOLEAN DEFAULT false,
  is_live_mode BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Logs
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id),
  transaction_id UUID REFERENCES public.transactions(id),
  gateway TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Air Ticket Bookings
CREATE TABLE IF NOT EXISTS public.air_ticket_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT NOT NULL DEFAULT ('AT-' || UPPER(SUBSTRING(uuid_generate_v4()::TEXT FROM 1 FOR 8))),
  user_id UUID,
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  return_date TEXT,
  is_round_trip BOOLEAN DEFAULT false,
  trip_type public.trip_type DEFAULT 'one_way',
  cabin_class public.cabin_class DEFAULT 'economy',
  passenger_count INTEGER DEFAULT 1,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  country_code TEXT DEFAULT '+880',
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  remarks TEXT,
  status public.air_ticket_status DEFAULT 'pending',
  price DECIMAL(10,2),
  ticket_number TEXT,
  ticket_file_url TEXT,
  pnr_number TEXT,
  admin_notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Air Ticket Passengers
CREATE TABLE IF NOT EXISTS public.air_ticket_passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.air_ticket_bookings(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender public.gender_type NOT NULL,
  date_of_birth TEXT NOT NULL,
  nationality TEXT DEFAULT 'Bangladeshi',
  passport_number TEXT,
  passport_expiry TEXT,
  is_child BOOLEAN DEFAULT false,
  child_age INTEGER,
  frequent_flyer_number TEXT,
  special_service_request TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Air Ticket Routes
CREATE TABLE IF NOT EXISTS public.air_ticket_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.air_ticket_bookings(id),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  travel_date TEXT NOT NULL,
  route_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Air Ticket Settings
CREATE TABLE IF NOT EXISTS public.air_ticket_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotels
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT DEFAULT 'Saudi Arabia',
  star_rating INTEGER NOT NULL,
  distance_from_haram DECIMAL(5,2) NOT NULL,
  description TEXT,
  details TEXT[],
  facilities TEXT[],
  images TEXT[],
  price_per_night DECIMAL(10,2),
  contact_email TEXT,
  contact_phone TEXT,
  google_map_link TEXT,
  google_map_embed_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Booking Requests
CREATE TABLE IF NOT EXISTS public.hotel_booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id TEXT NOT NULL,
  hotel_id UUID REFERENCES public.hotels(id),
  user_id UUID,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  country_code TEXT DEFAULT '+880',
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  room_count INTEGER DEFAULT 1,
  room_category TEXT,
  adult_count INTEGER DEFAULT 1,
  child_count INTEGER DEFAULT 0,
  special_requests TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Section Settings
CREATE TABLE IF NOT EXISTS public.hotel_section_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  is_enabled BOOLEAN DEFAULT true,
  booking_enabled BOOLEAN DEFAULT true,
  show_details_button BOOLEAN DEFAULT true,
  show_map_button BOOLEAN DEFAULT true,
  sort_by TEXT DEFAULT 'order_index',
  sort_order TEXT DEFAULT 'asc',
  star_label TEXT,
  hotels_per_page INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visa Countries
CREATE TABLE IF NOT EXISTS public.visa_countries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  processing_time TEXT NOT NULL,
  description TEXT,
  requirements TEXT[],
  documents_needed TEXT[],
  validity_period TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visa Applications
CREATE TABLE IF NOT EXISTS public.visa_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  visa_country_id UUID NOT NULL REFERENCES public.visa_countries(id),
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  applicant_count INTEGER DEFAULT 1,
  nationality TEXT,
  passport_number TEXT,
  date_of_birth TEXT,
  travel_date TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'unpaid',
  payment_method TEXT,
  transaction_id TEXT,
  bank_transaction_number TEXT,
  bank_transfer_screenshot_url TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hero Content
CREATE TABLE IF NOT EXISTS public.hero_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  badge_text TEXT,
  background_image_url TEXT,
  video_url TEXT,
  slide_type TEXT DEFAULT 'image',
  primary_button_text TEXT,
  primary_button_link TEXT,
  secondary_button_text TEXT,
  secondary_button_link TEXT,
  stats JSONB,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  location TEXT,
  avatar_url TEXT,
  package_name TEXT,
  display_location TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_video BOOLEAN DEFAULT false,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ Items
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  board_type TEXT DEFAULT 'team',
  qualifications TEXT,
  whatsapp_number TEXT,
  imo_number TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Images
CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  caption TEXT,
  category TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Videos
CREATE TABLE IF NOT EXISTS public.gallery_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gallery Settings
CREATE TABLE IF NOT EXISTS public.gallery_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT DEFAULT 'Gallery',
  subtitle TEXT,
  is_enabled BOOLEAN DEFAULT true,
  default_view TEXT DEFAULT 'grid',
  columns_desktop INTEGER DEFAULT 4,
  columns_tablet INTEGER DEFAULT 3,
  columns_mobile INTEGER DEFAULT 2,
  image_aspect_ratio TEXT DEFAULT '1:1',
  image_border_radius TEXT DEFAULT '8px',
  show_captions BOOLEAN DEFAULT true,
  show_thumbnails BOOLEAN DEFAULT true,
  lightbox_enabled BOOLEAN DEFAULT true,
  hover_effect TEXT DEFAULT 'zoom',
  autoplay_carousel BOOLEAN DEFAULT false,
  autoplay_speed INTEGER DEFAULT 3000,
  background_color TEXT,
  overlay_color TEXT,
  title_color TEXT,
  subtitle_color TEXT,
  video_enabled BOOLEAN DEFAULT false,
  video_url TEXT,
  video_opacity DECIMAL DEFAULT 0.5,
  video_speed DECIMAL DEFAULT 1,
  video_blur INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Info
CREATE TABLE IF NOT EXISTS public.contact_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  map_link TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Footer Content
CREATE TABLE IF NOT EXISTS public.footer_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_description TEXT,
  contact_address TEXT,
  contact_address_2 TEXT,
  address_label_1 TEXT,
  address_label_2 TEXT,
  contact_email TEXT,
  contact_phones TEXT[],
  copyright_text TEXT,
  quick_links JSONB,
  services_links JSONB,
  social_links JSONB,
  video_url TEXT,
  video_enabled BOOLEAN DEFAULT false,
  video_opacity DECIMAL DEFAULT 0.3,
  video_speed DECIMAL DEFAULT 0.5,
  video_blur INTEGER DEFAULT 2,
  video_overlay_color TEXT DEFAULT 'rgba(0,0,0,0.85)',
  video_scale DECIMAL DEFAULT 1,
  video_position TEXT DEFAULT 'center',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notices
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  notice_type TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'normal',
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  start_date TEXT,
  end_date TEXT,
  external_link TEXT,
  external_link_text TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Section Settings
CREATE TABLE IF NOT EXISTS public.section_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  badge_text TEXT,
  success_rate TEXT,
  image_url TEXT,
  bg_color TEXT,
  text_color TEXT,
  custom_css TEXT,
  stats JSONB,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Networks
CREATE TABLE IF NOT EXISTS public.social_networks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_name TEXT DEFAULT 'Globe',
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About Content
CREATE TABLE IF NOT EXISTS public.about_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'About Us',
  subtitle TEXT,
  image_url TEXT,
  mission_title TEXT,
  mission_text TEXT,
  vision_title TEXT,
  vision_text TEXT,
  history_title TEXT,
  history_text TEXT,
  values_title TEXT,
  values_items JSONB,
  stats JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Categories
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image_url TEXT,
  category_id UUID REFERENCES public.blog_categories(id),
  author_id UUID,
  seo_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Pages
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  package_id UUID REFERENCES public.packages(id),
  lead_status TEXT DEFAULT 'new',
  lead_score INTEGER DEFAULT 0,
  budget_range TEXT,
  group_size INTEGER,
  travel_month TEXT,
  passport_ready BOOLEAN,
  payment_value DECIMAL(10,2),
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  fbclid TEXT,
  original_event_id TEXT,
  device_type TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  referral_link_code TEXT NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 5,
  total_leads INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Leads
CREATE TABLE IF NOT EXISTS public.agent_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  commission_amount DECIMAL(10,2) DEFAULT 0,
  converted BOOLEAN DEFAULT false,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Codes
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  reward_amount DECIMAL(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.leads(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referral Conversions
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  referred_booking_id UUID REFERENCES public.bookings(id),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Inquiries
CREATE TABLE IF NOT EXISTS public.group_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  traveler_count INTEGER DEFAULT 1,
  travel_date TEXT,
  preferred_package_id UUID REFERENCES public.packages(id),
  budget TEXT,
  special_requirements TEXT,
  lead_status TEXT DEFAULT 'new',
  assigned_to UUID,
  group_discount DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Sequences
CREATE TABLE IF NOT EXISTS public.crm_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT DEFAULT 'sms',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Sequence Steps
CREATE TABLE IF NOT EXISTS public.crm_sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID NOT NULL REFERENCES public.crm_sequences(id),
  step_number INTEGER NOT NULL,
  message_template TEXT NOT NULL,
  day_offset INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM Lead Sequences
CREATE TABLE IF NOT EXISTS public.crm_lead_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  sequence_id UUID NOT NULL REFERENCES public.crm_sequences(id),
  current_step INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audience Segments
CREATE TABLE IF NOT EXISTS public.audience_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  segment_name TEXT NOT NULL,
  segment_type TEXT NOT NULL,
  criteria JSONB DEFAULT '{}',
  lead_ids TEXT[] DEFAULT '{}',
  lead_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key TEXT NOT NULL,
  template_name TEXT NOT NULL,
  sms_template TEXT,
  email_subject TEXT,
  email_template TEXT,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES public.bookings(id),
  booking_type TEXT,
  notification_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL,
  message_content TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Event Logs
CREATE TABLE IF NOT EXISTS public.marketing_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id),
  booking_id UUID REFERENCES public.bookings(id),
  status TEXT DEFAULT 'pending',
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketing Settings
CREATE TABLE IF NOT EXISTS public.marketing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  setting_value JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Office Locations
CREATE TABLE IF NOT EXISTS public.office_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phones TEXT[] DEFAULT '{}',
  email TEXT,
  map_query TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  description TEXT,
  opening_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch TEXT,
  account_type TEXT DEFAULT 'current',
  opening_balance DECIMAL(10,2) DEFAULT 0,
  current_balance DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- General Ledger
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  transaction_date TEXT DEFAULT CURRENT_DATE::TEXT,
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  debit DECIMAL(10,2) DEFAULT 0,
  credit DECIMAL(10,2) DEFAULT 0,
  running_balance DECIMAL(10,2) DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Transactions
CREATE TABLE IF NOT EXISTS public.income_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  booking_id UUID REFERENCES public.bookings(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  customer_name TEXT,
  reference_number TEXT,
  transaction_date TEXT DEFAULT CURRENT_DATE::TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense Transactions
CREATE TABLE IF NOT EXISTS public.expense_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_category TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  vendor_supplier TEXT,
  reference_number TEXT,
  transaction_date TEXT DEFAULT CURRENT_DATE::TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup History
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_name TEXT NOT NULL,
  backup_type TEXT DEFAULT 'full',
  file_path TEXT NOT NULL,
  file_size INTEGER,
  tables_included TEXT[] DEFAULT '{}',
  record_counts JSONB,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restore History
CREATE TABLE IF NOT EXISTS public.restore_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_id UUID REFERENCES public.backup_history(id),
  restore_type TEXT DEFAULT 'full',
  tables_restored TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'completed',
  notes TEXT,
  restored_by UUID,
  restored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  language_code TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theme Settings
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT,
  text_color TEXT,
  font_family TEXT,
  heading_font TEXT,
  border_radius TEXT,
  dark_mode_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Terminal Content
CREATE TABLE IF NOT EXISTS public.terminal_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  terminal_text TEXT,
  bg_color TEXT,
  text_color TEXT,
  font_size TEXT,
  typing_animation BOOLEAN DEFAULT true,
  is_enabled BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Downloadable Resources
CREATE TABLE IF NOT EXISTS public.downloadable_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource Downloads
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id UUID NOT NULL REFERENCES public.downloadable_resources(id),
  lead_id UUID REFERENCES public.leads(id),
  source TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webinars
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  session_date TEXT NOT NULL,
  max_capacity INTEGER DEFAULT 100,
  registration_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webinar Registrations
CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webinar_id UUID NOT NULL REFERENCES public.webinars(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  preferred_session TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_package_id ON public.bookings(package_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_packages_type ON public.packages(type);
CREATE INDEX idx_packages_is_active ON public.packages(is_active);
CREATE INDEX idx_air_ticket_bookings_status ON public.air_ticket_bookings(status);
CREATE INDEX idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_notification_logs_booking_id ON public.notification_logs(booking_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_staff_members_user_id ON public.staff_members(user_id);
CREATE INDEX idx_visa_applications_status ON public.visa_applications(status);
CREATE INDEX idx_hotel_booking_requests_status ON public.hotel_booking_requests(status);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_is_published ON public.blog_posts(is_published);
CREATE INDEX idx_general_ledger_account_id ON public.general_ledger(account_id);
CREATE INDEX idx_emi_installments_status ON public.emi_installments(status);
