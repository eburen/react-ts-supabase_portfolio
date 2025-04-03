-- Fix the coupon validation function to reference the correct table name in error message
CREATE OR REPLACE FUNCTION public.validate_order_coupon()
RETURNS TRIGGER AS $$
DECLARE
    _coupon RECORD;
BEGIN
    -- Skip validation if no coupon code is provided
    IF NEW.coupon_code IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Check if the coupon exists
    SELECT * INTO _coupon
    FROM public.coupons
    WHERE code = NEW.coupon_code;
    
    IF _coupon IS NULL THEN
        RAISE EXCEPTION 'Invalid coupon code: %', NEW.coupon_code;
    END IF;
    
    -- Validate coupon is active and not expired
    IF NOT _coupon.is_active OR 
       (_coupon.expiry_date IS NOT NULL AND _coupon.expiry_date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Coupon % is not valid or has expired', NEW.coupon_code;
    END IF;
    
    -- Ensure discount amount is valid
    IF NEW.coupon_discount IS NULL OR NEW.coupon_discount < 0 THEN
        RAISE EXCEPTION 'Invalid discount amount for coupon %', NEW.coupon_code;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 