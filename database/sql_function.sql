-- Create function to execute arbitrary SQL
-- This requires admin privileges to create and execute
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executes with privileges of the function creator
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN jsonb_build_object('status', 'success');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$; 