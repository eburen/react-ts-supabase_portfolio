-- Enable Row Level Security on coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create policies for admins to manage coupons
CREATE POLICY "Admins can view all coupons" 
ON public.coupons
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IN (
    SELECT id FROM public.users WHERE role = 'admin'
));

CREATE POLICY "Admins can insert coupons" 
ON public.coupons
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IN (
    SELECT id FROM public.users WHERE role = 'admin'
));

CREATE POLICY "Admins can update coupons" 
ON public.coupons
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) IN (
    SELECT id FROM public.users WHERE role = 'admin'
))
WITH CHECK ((SELECT auth.uid()) IN (
    SELECT id FROM public.users WHERE role = 'admin'
));

CREATE POLICY "Admins can delete coupons" 
ON public.coupons
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) IN (
    SELECT id FROM public.users WHERE role = 'admin'
));

-- Allow customers to view only active coupons
CREATE POLICY "Customers can view active coupons" 
ON public.coupons
FOR SELECT
TO authenticated
USING (
    is_active = TRUE AND 
    (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
);

-- Allow anonymous users to check coupon validity
CREATE POLICY "Anyone can view active coupons for validation" 
ON public.coupons
FOR SELECT
TO anon
USING (
    is_active = TRUE AND 
    (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
); 