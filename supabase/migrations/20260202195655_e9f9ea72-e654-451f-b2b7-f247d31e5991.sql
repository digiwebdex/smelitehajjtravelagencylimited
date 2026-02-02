-- Add 'viewer' to the user_role enum to support read-only demo accounts
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';