-- Insert section settings for Hajj and Umrah packages
INSERT INTO section_settings (section_key, title, subtitle, description, is_active)
VALUES 
  ('hajj_packages', 'Hajj Packages 2026', 'حج', 'Premium Hajj packages for the sacred pilgrimage to Makkah. Experience the journey of a lifetime with complete care and guidance.', true),
  ('umrah_packages', 'Umrah Packages', 'عمرة', 'Year-round Umrah packages with flexible options. Visit the holy cities of Makkah and Madinah with our expert guidance and premium services.', true)
ON CONFLICT (section_key) DO NOTHING;

-- Add extra columns for section stats and images
ALTER TABLE section_settings 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS badge_text TEXT;

-- Update with initial stats data
UPDATE section_settings 
SET 
  image_url = NULL,
  badge_text = 'Hajj Packages',
  stats = '[{"value": "10+", "label": "Hajj Years Experience"}, {"value": "5000+", "label": "Happy Pilgrims"}]'::jsonb
WHERE section_key = 'hajj_packages';

UPDATE section_settings 
SET 
  image_url = NULL,
  badge_text = 'Umrah Packages',
  stats = '[{"value": "15+", "label": "Umrah Years Experience"}, {"value": "3000+", "label": "Happy Pilgrims"}]'::jsonb
WHERE section_key = 'umrah_packages';