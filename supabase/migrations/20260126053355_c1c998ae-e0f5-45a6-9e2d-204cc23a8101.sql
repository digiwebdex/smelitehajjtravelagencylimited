-- Add video fields to gallery_settings table
ALTER TABLE public.gallery_settings
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS video_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_opacity NUMERIC DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS video_blur INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_speed NUMERIC DEFAULT 1.0;