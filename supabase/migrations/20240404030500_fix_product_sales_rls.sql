-- Migration: fix_product_sales_rls
-- Description: Enables RLS on product_sales table and fixes constraint issues
-- Date: 2024-04-04

-- Enable Row Level Security on the product_sales table
alter table public.product_sales enable row level security;

-- Add Row Level Security Policies for the product_sales table
-- Allow authenticated users to view all product sales
create policy "authenticated users can view product sales" 
on public.product_sales
for select
to authenticated
using (true);

-- Allow admin users to manage product sales (insert, update, delete)
create policy "admins can insert product sales" 
on public.product_sales
for insert
to authenticated
with check (auth.jwt() ->> 'role' = 'admin'); 

create policy "admins can update product sales" 
on public.product_sales
for update
to authenticated
using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

create policy "admins can delete product sales" 
on public.product_sales
for delete
to authenticated
using (auth.jwt() ->> 'role' = 'admin');

-- Re-create the unique constraints as unique indexes to fix syntax errors
-- First, drop any existing unique constraints or indexes if they exist
drop index if exists idx_unique_active_product_sale;
drop index if exists idx_unique_active_variation_sale;

-- Create the unique indexes with the correct partial index syntax
create unique index idx_unique_active_product_sale 
on public.product_sales (product_id, active) 
where (variation_id is null and active = true);

create unique index idx_unique_active_variation_sale 
on public.product_sales (variation_id, active) 
where (variation_id is not null and active = true); 