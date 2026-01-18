-- Add success_rate column to section_settings
ALTER TABLE section_settings 
ADD COLUMN IF NOT EXISTS success_rate TEXT DEFAULT '100%';

-- Update existing records with default values
UPDATE section_settings 
SET success_rate = '100%'
WHERE section_key IN ('hajj_packages', 'umrah_packages');