-- Add video overlay color column to footer_content
ALTER TABLE public.footer_content 
ADD COLUMN IF NOT EXISTS video_overlay_color text DEFAULT 'rgba(0, 0, 0, 0.5)';