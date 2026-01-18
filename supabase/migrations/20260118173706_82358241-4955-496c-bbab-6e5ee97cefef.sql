-- Add extended package details columns
ALTER TABLE public.packages
ADD COLUMN IF NOT EXISTS full_description text,
ADD COLUMN IF NOT EXISTS exclusions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hotel_type text,
ADD COLUMN IF NOT EXISTS transport_type text,
ADD COLUMN IF NOT EXISTS flight_type text,
ADD COLUMN IF NOT EXISTS special_notes text,
ADD COLUMN IF NOT EXISTS show_view_details boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_book_now boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.packages.full_description IS 'Extended description for package details view';
COMMENT ON COLUMN public.packages.exclusions IS 'List of items not included in the package';
COMMENT ON COLUMN public.packages.hotel_type IS 'Type of hotel accommodation';
COMMENT ON COLUMN public.packages.transport_type IS 'Type of ground transport provided';
COMMENT ON COLUMN public.packages.flight_type IS 'Type of flight (economy, business, etc.)';
COMMENT ON COLUMN public.packages.special_notes IS 'Special conditions or notes for the package';
COMMENT ON COLUMN public.packages.show_view_details IS 'Toggle visibility of View Details button';
COMMENT ON COLUMN public.packages.show_book_now IS 'Toggle visibility of Book Now button';