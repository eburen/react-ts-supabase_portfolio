# Database Migrations

This directory contains SQL migration files for the Supabase database.

## How to Apply Migrations

Migrations should be applied in the order they were created. You can apply migrations using the Supabase dashboard's SQL editor or through the Supabase CLI.

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Create a new query
4. Copy the contents of the migration file
5. Run the query

### Using Supabase CLI

1. Make sure you have the Supabase CLI installed
2. Run the following command:

```bash
supabase db push
```

## Migration Files

Apply these files in the following order:

1.  `schema.sql` - The base schema for the database
2.  `update_orders_schema.sql` - Adds additional fields to orders table
3.  `address_rls_fix.sql` - Adds Row Level Security policies for shipping addresses
4.  `cart_rls_fix.sql` - Adds Row Level Security policies for cart items
5.  `update_users_add_profile_fields.sql` - Adds birthday, gender, and phone number fields to users table
6.  `create_is_admin_function.sql` - Creates a function to check if the current user is an admin
7.  `users_rls_fix.sql` - Fixes Row Level Security policies for users table using the `is_admin` function 