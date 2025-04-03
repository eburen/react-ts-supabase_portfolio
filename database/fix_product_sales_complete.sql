-- Start transaction
begin;

-- Drop the product_sales table if it exists (caution: this will delete existing data)
drop table if exists public.product_sales cascade;

-- Create product_sales table
create table public.product_sales (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid not null references public.products(id) on delete cascade,
    variation_id uuid references public.product_variations(id) on delete cascade,
    discount_percentage numeric(5, 2) not null check (discount_percentage > 0 and discount_percentage <= 100),
    start_date date not null,
    end_date date not null,
    active boolean not null default true,
    created_at timestamp with time zone default now(),
    
    -- Ensure end_date is after start_date
    constraint end_after_start check (end_date >= start_date)
);

-- Create unique partial indexes instead of constraints with WHERE clauses
create unique index idx_unique_active_product_sale 
on public.product_sales (product_id, active) 
where (variation_id is null and active = true);

create unique index idx_unique_active_variation_sale 
on public.product_sales (variation_id, active) 
where (variation_id is not null and active = true);

-- Create indexes for better query performance
create index idx_product_sales_product_id on public.product_sales(product_id);
create index idx_product_sales_variation_id on public.product_sales(variation_id);
create index idx_product_sales_active on public.product_sales(active);

-- Create functions to check for active sales
create or replace function public.get_product_active_sale(product_id uuid) 
returns uuid as $$
declare
    sale_id uuid;
begin
    select id into sale_id
    from public.product_sales
    where product_id = $1
      and variation_id is null
      and active = true
      and start_date <= current_date
      and end_date >= current_date;
      
    return sale_id;
end;
$$ language plpgsql security invoker;

create or replace function public.get_variation_active_sale(variation_id uuid) 
returns uuid as $$
declare
    sale_id uuid;
begin
    select id into sale_id
    from public.product_sales
    where variation_id = $1
      and active = true
      and start_date <= current_date
      and end_date >= current_date;
      
    return sale_id;
end;
$$ language plpgsql security invoker;

-- Enable Row Level Security
alter table public.product_sales enable row level security;

-- Add RLS policies
-- Allow authenticated users to view all product sales
create policy "authenticated users can view product sales" 
on public.product_sales
for select
to authenticated
using (true);

-- Allow admin users to manage product sales
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

-- Commit transaction
commit; 