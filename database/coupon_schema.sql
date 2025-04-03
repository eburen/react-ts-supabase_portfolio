-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    minimum_purchase NUMERIC(10, 2) CHECK (minimum_purchase IS NULL OR minimum_purchase > 0),
    expiry_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional validation constraints
    CONSTRAINT valid_percentage_discount CHECK (
        discount_type != 'percentage' OR (discount_value > 0 AND discount_value <= 100)
    )
);
COMMENT ON TABLE public.coupons IS 'Stores discount coupons that can be applied to orders at checkout';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry_date ON public.coupons(expiry_date);

-- Create function to validate coupon
CREATE OR REPLACE FUNCTION public.is_valid_coupon(coupon_code TEXT, order_total NUMERIC DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    _coupon public.coupons;
BEGIN
    -- Get the coupon
    SELECT * INTO _coupon
    FROM public.coupons
    WHERE code = coupon_code
      AND is_active = TRUE
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
      
    -- Return false if no valid coupon found
    IF _coupon IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if the order total meets the minimum purchase requirement
    IF order_total IS NOT NULL AND 
       _coupon.minimum_purchase IS NOT NULL AND 
       order_total < _coupon.minimum_purchase THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Create function to calculate discount amount
CREATE OR REPLACE FUNCTION public.calculate_discount(coupon_code TEXT, order_total NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    _coupon public.coupons;
    _discount NUMERIC;
BEGIN
    -- Get the coupon
    SELECT * INTO _coupon
    FROM public.coupons
    WHERE code = coupon_code
      AND is_active = TRUE
      AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
      
    -- Return 0 if no valid coupon found
    IF _coupon IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check if the order total meets the minimum purchase requirement
    IF _coupon.minimum_purchase IS NOT NULL AND order_total < _coupon.minimum_purchase THEN
        RETURN 0;
    END IF;
    
    -- Calculate discount based on type
    IF _coupon.discount_type = 'percentage' THEN
        _discount := order_total * (_coupon.discount_value / 100);
    ELSE -- 'fixed'
        _discount := LEAST(_coupon.discount_value, order_total);
    END IF;
    
    RETURN _discount;
END;
$$;

-- Add a trigger function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for update timestamp
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column(); 