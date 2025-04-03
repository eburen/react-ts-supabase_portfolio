-- Add coupon-related columns to the orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0;

-- Drop the old foreign key constraint if it exists (we'll use coupon_code instead of coupon_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_orders_coupons' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT fk_orders_coupons;
    END IF;
END $$;

-- Create a function to validate coupon at order time
CREATE OR REPLACE FUNCTION public.validate_order_coupon()
RETURNS TRIGGER AS $$
DECLARE
    _coupon public.coupons;
    _discount DECIMAL(10, 2);
BEGIN
    -- If no coupon code is provided, nothing to check
    IF NEW.coupon_code IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if the coupon exists and is valid
    SELECT * INTO _coupon
    FROM public.coupons
    WHERE code = NEW.coupon_code
      AND is_active = TRUE
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
      
    -- If coupon not found or invalid, clear coupon fields
    IF _coupon IS NULL THEN
        NEW.coupon_code := NULL;
        NEW.coupon_discount := 0;
        RETURN NEW;
    END IF;
    
    -- Check minimum purchase requirement
    IF _coupon.minimum_purchase IS NOT NULL AND NEW.total < _coupon.minimum_purchase THEN
        NEW.coupon_code := NULL;
        NEW.coupon_discount := 0;
        RETURN NEW;
    END IF;
    
    -- Calculate valid discount
    IF _coupon.discount_type = 'percentage' THEN
        _discount := (NEW.total * _coupon.discount_value / 100);
    ELSE -- 'fixed'
        _discount := LEAST(_coupon.discount_value, NEW.total);
    END IF;
    
    -- Update the discount amount
    NEW.coupon_discount := _discount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to validate coupons on order insert or update
DROP TRIGGER IF EXISTS validate_order_coupon_trigger ON public.orders;
CREATE TRIGGER validate_order_coupon_trigger
BEFORE INSERT OR UPDATE OF coupon_code ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.validate_order_coupon();

-- Update order total calculation to include discount
CREATE OR REPLACE FUNCTION public.update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate total based on shipping, gift wrapping, and coupon discount
    NEW.total := (
        NEW.total - COALESCE(OLD.coupon_discount, 0) + COALESCE(NEW.coupon_discount, 0)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to update total when coupon discount changes
DROP TRIGGER IF EXISTS update_order_total_trigger ON public.orders;
CREATE TRIGGER update_order_total_trigger
BEFORE UPDATE OF coupon_discount ON public.orders
FOR EACH ROW
WHEN (NEW.coupon_discount IS DISTINCT FROM OLD.coupon_discount)
EXECUTE FUNCTION public.update_order_total(); 