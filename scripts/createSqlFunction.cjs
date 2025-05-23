const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Supabase URL or Service Role Key not found in environment variables.');
    process.exit(1);
}

async function createSqlFunction() {
    try {
        const sqlFunctionPath = path.join(__dirname, '..', 'database', 'sql_function.sql');
        console.log(`Reading SQL function file: ${sqlFunctionPath}`);
        const sql = fs.readFileSync(sqlFunctionPath, 'utf8');

        console.log('Creating SQL function in Supabase...');

        // Use the SQL API to execute the function creation script
        const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceRoleKey,
                'Authorization': `Bearer ${supabaseServiceRoleKey}`
            },
            body: JSON.stringify({
                query: sql
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error creating SQL function:', errorText);
            return;
        }

        const result = await response.json();
        console.log('SQL function created successfully:', result);
    } catch (err) {
        console.error('Error:', err);
    }
}

createSqlFunction(); 