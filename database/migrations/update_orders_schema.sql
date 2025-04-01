-- Add new columns to the orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'credit_card',
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(50),
ADD COLUMN IF NOT EXISTS gift_wrapping BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_note TEXT,
ADD COLUMN IF NOT EXISTS special_instructions TEXT,
ADD COLUMN IF NOT EXISTS express_shipping BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gift_wrapping_fee DECIMAL(10, 2) DEFAULT 0;

-- Add updated_at column to order_items if it doesn't exist
ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update status check constraint to include all possible values
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'));

-- Add payment_status check constraint
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Add payment_method check constraint
ALTER TABLE public.orders
ADD CONSTRAINT orders_payment_method_check CHECK (payment_method IN ('credit_card', 'cash_on_delivery', 'paypal', 'bank_transfer'));

-- Create an index on user_id and payment_status for faster queries
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);

-- Create an index on order_id for order_items for faster joins
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id); 