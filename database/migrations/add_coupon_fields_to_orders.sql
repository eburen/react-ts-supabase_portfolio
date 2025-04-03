-- Add coupon fields to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0;

-- Create index for faster coupon lookups
CREATE INDEX IF NOT EXISTS orders_coupon_code_idx ON public.orders(coupon_code);

-- Remove incorrect foreign key constraint if it exists
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS fk_orders_coupons;

-- Create function to validate coupon at order time
CREATE OR REPLACE FUNCTION public.validate_order_coupon()
RETURNS TRIGGER AS $$
DECLARE
    _coupon_exists BOOLEAN;
    _coupon_is_valid BOOLEAN;
BEGIN
    -- Skip validation if no coupon code is provided
    IF NEW.coupon_code IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if the coupon exists and is valid
    SELECT 
        EXISTS(SELECT 1 FROM public.coupons WHERE code = NEW.coupon_code) INTO _coupon_exists;
    
    IF NOT _coupon_exists THEN
        RAISE EXCEPTION 'Could not find the ''coupon_code'' column of table ''public.coupon'': %', NEW.coupon_code;
    END IF;
    
    -- Validate coupon (active, not expired, etc.)
    SELECT 
        EXISTS(
            SELECT 1 FROM public.coupons 
            WHERE code = NEW.coupon_code
            AND is_active = TRUE
            AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
        ) INTO _coupon_is_valid;
    
    IF NOT _coupon_is_valid THEN
        RAISE EXCEPTION 'Coupon % is not valid or has expired', NEW.coupon_code;
    END IF;
    
    -- Ensure discount amount is valid
    IF NEW.coupon_discount IS NULL OR NEW.coupon_discount < 0 THEN
        RAISE EXCEPTION 'Invalid discount amount for coupon %', NEW.coupon_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to validate coupons on order insert or update
DROP TRIGGER IF EXISTS validate_order_coupon_trigger ON public.orders;

CREATE TRIGGER validate_order_coupon_trigger
BEFORE INSERT OR UPDATE OF coupon_code, coupon_discount ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_coupon();

-- Add trigger to update total when coupon fields change
CREATE OR REPLACE FUNCTION public.update_order_total_on_coupon_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total to reflect the coupon discount
    IF NEW.coupon_discount != OLD.coupon_discount OR 
       (NEW.coupon_code IS DISTINCT FROM OLD.coupon_code) THEN
        -- Recalculate the total based on order items, fees, and the new discount
        NEW.total = (
            SELECT COALESCE(SUM(price * quantity), 0) 
            FROM public.order_items 
            WHERE order_id = NEW.id
        ) + NEW.shipping_fee + NEW.gift_wrapping_fee - NEW.coupon_discount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 