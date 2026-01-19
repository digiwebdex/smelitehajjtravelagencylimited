-- Add address label columns to footer_content
ALTER TABLE public.footer_content 
ADD COLUMN address_label_1 text DEFAULT 'Head Office',
ADD COLUMN address_label_2 text DEFAULT 'Branch Office';