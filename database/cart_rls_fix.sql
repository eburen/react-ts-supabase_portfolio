-- Add RLS policies for cart_items table

-- Policy for users to view their own cart items
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own cart items
CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own cart items
CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own cart items
CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for admins to manage all cart items (optional)
CREATE POLICY "Admins can manage all cart items" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  ); 