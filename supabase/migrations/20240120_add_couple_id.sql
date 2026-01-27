
-- Add couple_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS couple_id UUID;

-- Optional: Initialize couple_id to be the user's own ID for existing users who are single
UPDATE profiles SET couple_id = id WHERE couple_id IS NULL AND partner_id IS NULL;
