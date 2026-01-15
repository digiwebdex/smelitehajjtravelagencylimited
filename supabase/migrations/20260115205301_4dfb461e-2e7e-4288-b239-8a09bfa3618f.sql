-- Add video_url column to hero_content table for the "Watch Our Journey Video" button
ALTER TABLE public.hero_content 
ADD COLUMN video_url TEXT DEFAULT NULL;