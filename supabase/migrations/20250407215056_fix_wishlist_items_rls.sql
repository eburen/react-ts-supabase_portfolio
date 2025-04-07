-- Enable Row Level Security on wishlist_items table if not already enabled
ALTER TABLE IF EXISTS wishlist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Users can add to their own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Users can remove from their own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Public read access disabled" ON wishlist_items;

-- Policy for authenticated users to select their own wishlist items
CREATE POLICY "Users can view their own wishlist items" 
ON wishlist_items
FOR SELECT 
TO authenticated
USING ((user_id = auth.uid()));

-- Policy for authenticated users to insert their own wishlist items
CREATE POLICY "Users can add to their own wishlist" 
ON wishlist_items
FOR INSERT 
TO authenticated
WITH CHECK ((user_id = auth.uid()));

-- Policy for authenticated users to delete their own wishlist items
CREATE POLICY "Users can remove from their own wishlist" 
ON wishlist_items
FOR DELETE 
TO authenticated
USING ((user_id = auth.uid()));

-- Policy for public access (anonymous users)
CREATE POLICY "Public read access disabled" 
ON wishlist_items
FOR SELECT 
TO anon
USING (false); 