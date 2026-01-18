-- Add is_featured column to visa_countries
ALTER TABLE public.visa_countries 
ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Mark some existing countries as featured (optional sample data)
UPDATE public.visa_countries 
SET is_featured = true 
WHERE country_name IN ('Thailand', 'Malaysia', 'Japan');