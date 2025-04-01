import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Supabase URL or Service Role Key not found in environment variables.');
    process.exit(1);
}

async function applyCartRlsPolicy() {
    try {
        const sqlFilePath = path.join(__dirname, '..', 'database', 'cart_rls_fix.sql');
        console.log(`Reading SQL file: ${sqlFilePath}`);
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Applying cart item RLS policies to Supabase...');

        // We'll use the SQL HTTP API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceRoleKey,
                'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({
                sql_query: sql
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error applying RLS policies:', errorText);
            return;
        }

        console.log('Cart item RLS policies successfully applied!');
    } catch (err) {
        console.error('Error:', err);
    }
}

// Execute the function
applyCartRlsPolicy(); 