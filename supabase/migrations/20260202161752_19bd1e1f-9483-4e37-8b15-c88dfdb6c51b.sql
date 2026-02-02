-- Add country column to hotels table
ALTER TABLE public.hotels 
ADD COLUMN country TEXT DEFAULT 'Saudi Arabia';

-- Update existing hotels to have the default country value
UPDATE public.hotels SET country = 'Saudi Arabia' WHERE country IS NULL;

-- Add an index for better query performance when filtering by country
CREATE INDEX idx_hotels_country ON public.hotels(country);