-- Add requirements and documents columns to visa_countries table
ALTER TABLE public.visa_countries 
ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS documents_needed TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS validity_period TEXT;

-- Update existing records with sample data
UPDATE public.visa_countries SET 
  requirements = ARRAY['Valid passport with 6+ months validity', 'Completed visa application form', 'Recent passport-sized photos', 'Proof of accommodation', 'Travel itinerary'],
  documents_needed = ARRAY['Original passport', 'Passport copy', 'Bank statements (last 3 months)', 'Employment letter', 'Hotel booking confirmation', 'Flight reservation'],
  description = 'Standard tourist visa processing with comprehensive documentation support.',
  validity_period = '3 months'
WHERE requirements IS NULL OR array_length(requirements, 1) IS NULL;