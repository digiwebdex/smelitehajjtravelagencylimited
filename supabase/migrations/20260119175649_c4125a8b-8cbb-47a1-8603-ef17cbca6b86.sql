-- Add map_link column to contact_info table for clickable map links
ALTER TABLE public.contact_info 
ADD COLUMN map_link TEXT;