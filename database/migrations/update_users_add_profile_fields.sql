-- Add new profile fields to the users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for user search by phone number
CREATE INDEX IF NOT EXISTS users_phone_number_idx ON users(phone_number); 