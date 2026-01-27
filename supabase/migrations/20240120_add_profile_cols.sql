
-- Add relationship columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS relationship_start_date DATE,
ADD COLUMN IF NOT EXISTS relationship_status TEXT DEFAULT 'Namorando';
