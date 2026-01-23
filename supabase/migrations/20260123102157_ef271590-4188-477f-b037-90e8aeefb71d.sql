-- Add video background fields to footer_content table
ALTER TABLE public.footer_content 
ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_opacity integer DEFAULT 60,
ADD COLUMN IF NOT EXISTS video_enabled boolean DEFAULT true;