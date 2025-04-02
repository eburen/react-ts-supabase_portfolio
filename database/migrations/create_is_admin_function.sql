-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Important: Runs with definer's privileges, bypassing RLS for this check
SET search_path = public -- Ensure the function can find the users table
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$; 