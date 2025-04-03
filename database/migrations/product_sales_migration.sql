-- Create product_sales table
CREATE TABLE IF NOT EXISTS product_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variation_id UUID REFERENCES product_variations(id) ON DELETE CASCADE,
    discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure end_date is after start_date
    CONSTRAINT end_after_start CHECK (end_date >= start_date)
);

-- Create unique partial indexes instead of constraints with WHERE clauses
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_product_sale 
ON product_sales (product_id, active) 
WHERE (variation_id IS NULL AND active = TRUE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_variation_sale 
ON product_sales (variation_id, active) 
WHERE (variation_id IS NOT NULL AND active = TRUE);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_variation_id ON product_sales(variation_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_active ON product_sales(active);

-- Create or replace function to check if a product has active sales
CREATE OR REPLACE FUNCTION get_product_active_sale(product_id UUID) 
RETURNS UUID AS $$
DECLARE
    sale_id UUID;
BEGIN
    SELECT id INTO sale_id
    FROM product_sales
    WHERE product_id = $1
      AND variation_id IS NULL
      AND active = TRUE
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;
      
    RETURN sale_id;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to check if a variation has active sales
CREATE OR REPLACE FUNCTION get_variation_active_sale(variation_id UUID) 
RETURNS UUID AS $$
DECLARE
    sale_id UUID;
BEGIN
    SELECT id INTO sale_id
    FROM product_sales
    WHERE variation_id = $1
      AND active = TRUE
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;
      
    RETURN sale_id;
END;
$$ LANGUAGE plpgsql; 