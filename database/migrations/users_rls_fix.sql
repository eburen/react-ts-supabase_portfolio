-- Fix Row Level Security (RLS) policies for users table

-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Policy for users to view their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to manage all users, using the is_admin() function
CREATE POLICY "Admins can manage all users" ON users
  FOR ALL USING (is_admin());

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 