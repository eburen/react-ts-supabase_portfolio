-- Sample Product Categories
INSERT INTO products (name, description, base_price, images, category) VALUES 
('Modern Desk Lamp', 'A sleek and modern desk lamp with adjustable brightness.', 49.99, ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Lighting'),
('Ergonomic Office Chair', 'A comfortable ergonomic chair designed for long work hours.', 199.99, ARRAY['https://images.unsplash.com/photo-1589384267710-7a170981ca78?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Furniture'),
('Bluetooth Speaker', 'Portable Bluetooth speaker with rich sound and 12-hour battery life.', 79.99, ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Electronics'),
('Leather Wallet', 'Handcrafted genuine leather wallet with multiple card slots.', 39.99, ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Accessories'),
('Smart Watch', 'Fitness tracker and smartwatch with heart rate monitoring.', 129.99, ARRAY['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Electronics'),
('Cotton T-Shirt', 'Soft 100% cotton t-shirt available in various colors.', 19.99, ARRAY['https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Clothing'),
('Ceramic Coffee Mug', 'Elegant ceramic coffee mug that keeps your drinks warm.', 14.99, ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Kitchen'),
('Wireless Headphones', 'Noise-canceling wireless headphones with premium sound.', 159.99, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Electronics'),
('Yoga Mat', 'Non-slip yoga mat made from eco-friendly materials.', 29.99, ARRAY['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Fitness'),
('Stainless Steel Water Bottle', 'Insulated water bottle that keeps drinks cold for 24 hours.', 24.99, ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'], 'Kitchen');

-- Add Product Variations
INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'Black', 0, 50 FROM products WHERE name = 'Modern Desk Lamp';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'White', 0, 30 FROM products WHERE name = 'Modern Desk Lamp';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'Black', 0, 20 FROM products WHERE name = 'Ergonomic Office Chair';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'Gray', 0, 15 FROM products WHERE name = 'Ergonomic Office Chair';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'size', 'Small', -20, 25 FROM products WHERE name = 'Cotton T-Shirt';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'size', 'Medium', 0, 40 FROM products WHERE name = 'Cotton T-Shirt';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'size', 'Large', 0, 35 FROM products WHERE name = 'Cotton T-Shirt';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'size', 'X-Large', 5, 20 FROM products WHERE name = 'Cotton T-Shirt';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'Black', 0, 30 FROM products WHERE name = 'Wireless Headphones';

INSERT INTO product_variations (product_id, type, name, price_adjustment, stock) 
SELECT id, 'color', 'Silver', 10, 20 FROM products WHERE name = 'Wireless Headphones';

-- Create Sample Coupons
INSERT INTO coupons (code, discount_type, discount_value, minimum_purchase, expiry_date, is_active) VALUES
('WELCOME10', 'percentage', 10, 50, NOW() + INTERVAL '30 days', true),
('SUMMER25', 'percentage', 25, 100, NOW() + INTERVAL '60 days', true),
('FREESHIP', 'fixed', 10, 75, NOW() + INTERVAL '45 days', true);

-- Note: For users, we would normally create them through Supabase Auth
-- and then their profiles would be created via triggers or our application logic
-- This is just for demo purposes and should be adjusted for real implementation 