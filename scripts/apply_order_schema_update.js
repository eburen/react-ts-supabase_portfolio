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

async function applyOrderSchemaUpdate() {
    try {
        const sqlFilePath = path.join(__dirname, '..', 'database', 'migrations', 'update_orders_schema.sql');
        console.log(`Reading SQL file: ${sqlFilePath}`);
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Applying order schema updates to Supabase...');

        // Use the SQL HTTP API
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
            console.error('Error applying order schema updates:', errorText);
            return;
        }

        console.log('Order schema updates successfully applied!');
    } catch (err) {
        console.error('Error:', err);
    }
}

// Execute the function
applyOrderSchemaUpdate(); 