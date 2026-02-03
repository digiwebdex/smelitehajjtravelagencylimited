-- Add details field to hotels table for bullet point information
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS details TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.hotels.details IS 'Array of detail bullet points for the hotel';