-- Add RLS policies for shipping_addresses table

-- Policy for users to view their own addresses
CREATE POLICY "Users can view their own shipping addresses" ON shipping_addresses
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own addresses
CREATE POLICY "Users can insert their own shipping addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own addresses
CREATE POLICY "Users can update their own shipping addresses" ON shipping_addresses
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for users to delete their own addresses
CREATE POLICY "Users can delete their own shipping addresses" ON shipping_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Policy for admins to manage all addresses (optional)
CREATE POLICY "Admins can manage all shipping addresses" ON shipping_addresses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  ); 