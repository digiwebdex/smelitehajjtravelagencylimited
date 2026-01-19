-- Insert Bank Transfer payment method
INSERT INTO payment_methods (name, slug, description, icon_name, order_index, is_enabled, credentials)
VALUES (
  'Bank Transfer',
  'bank_transfer',
  'Transfer directly to our bank account',
  'Building',
  5,
  true,
  '{"bank_name": "BRAC Bank Limited", "account_name": "SM Elite Hajj Travel Agency Ltd", "account_number": "1501204528849001", "branch": "Gulshan Branch", "routing_number": "060261934", "swift_code": "BABORHDHXXX"}'::jsonb
);

-- Add columns to bookings for bank transfer details
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS bank_transfer_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS bank_transaction_number TEXT;