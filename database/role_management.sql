-- Drop existing functions first
DROP FUNCTION IF EXISTS public.assign_admin_role(UUID);
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Function to assign admin role to a user with improved error handling
CREATE OR REPLACE FUNCTION public.assign_admin_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user auth.users;
  _error_message TEXT;
BEGIN
  -- Check if the user exists
  BEGIN
    SELECT * INTO _user FROM auth.users WHERE id = user_id;
  EXCEPTION WHEN OTHERS THEN
    _error_message := 'Error accessing auth.users: ' || SQLERRM;
    RETURN _error_message;
  END;
  
  IF _user IS NULL THEN
    RETURN 'User does not exist: ' || user_id;
  END IF;
  
  -- First check if the users table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- Create the users table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  -- Try to update or insert the user in the users table with admin role
  BEGIN
    INSERT INTO public.users (id, email, full_name, role)
    VALUES (
      user_id, 
      _user.email, 
      COALESCE(_user.raw_user_meta_data->>'full_name', ''), 
      'admin'
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin', 
      email = _user.email,
      full_name = COALESCE(_user.raw_user_meta_data->>'full_name', EXCLUDED.full_name),
      updated_at = NOW();
    
    RETURN 'Successfully assigned admin role to ' || user_id;
  EXCEPTION WHEN OTHERS THEN
    _error_message := 'Error updating users table: ' || SQLERRM;
    RETURN _error_message;
  END;
  
EXCEPTION WHEN OTHERS THEN
  RETURN 'Unexpected error: ' || SQLERRM;
END;
$$;

-- Function to check if user is admin with improved error reporting
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- First check if the users table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RETURN FALSE;
  END IF;

  SELECT role INTO _role FROM public.users WHERE id = user_id;
  RETURN _role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error checking admin status: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Sample SQL to assign admin role (run in Supabase SQL editor)
-- SELECT public.assign_admin_role('YOUR-USER-ID-HERE');

-- Sample SQL to check if user is admin
-- SELECT public.is_admin('YOUR-USER-ID-HERE');

-- Sample SQL to see all current users with roles
-- SELECT
--   au.id,
--   au.email,
--   u.role,
--   au.created_at
-- FROM 
--   auth.users au
-- LEFT JOIN 
--   public.users u ON au.id = u.id
-- ORDER BY 
--   au.created_at DESC; 