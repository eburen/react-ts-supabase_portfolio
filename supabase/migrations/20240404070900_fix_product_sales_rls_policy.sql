-- Migration: fix_product_sales_rls_policy
-- Description: Updates RLS policies to allow all authenticated users to manage product sales
-- Date: 2024-04-04

-- Drop existing policies that restrict to admin users
drop policy if exists "admins can insert product sales" on public.product_sales;
drop policy if exists "admins can update product sales" on public.product_sales;
drop policy if exists "admins can delete product sales" on public.product_sales;

-- Create new policies for all authenticated users
create policy "authenticated users can insert product sales" 
on public.product_sales
for insert
to authenticated
with check (true); 

create policy "authenticated users can update product sales" 
on public.product_sales
for update
to authenticated
using (true)
with check (true);

create policy "authenticated users can delete product sales" 
on public.product_sales
for delete
to authenticated
using (true); 