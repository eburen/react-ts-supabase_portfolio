import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Supabase URL or Service Role Key not found in environment variables.');
    process.exit(1);
}

// Assign to a new const to help TypeScript narrow the type
const serviceKey: string = supabaseServiceRoleKey;

// Default path to SQL files
const DB_SCHEMA_PATH = path.join(__dirname, '..', 'database', 'schema.sql');
const DB_SAMPLE_DATA_PATH = path.join(__dirname, '..', 'database', 'sample_data.sql');

async function runSql(filePath: string): Promise<void> {
    try {
        console.log(`Reading SQL file: ${filePath}`);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log('Executing SQL on Supabase...');

        // We'll use the SQL HTTP API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`
            },
            body: JSON.stringify({
                sql_query: sql
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error executing SQL:', errorText);
            return;
        }

        console.log('SQL executed successfully');
    } catch (err) {
        console.error('Error:', err);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--schema')) {
        await runSql(DB_SCHEMA_PATH);
    } else if (args.includes('--sample-data')) {
        await runSql(DB_SAMPLE_DATA_PATH);
    } else if (args.includes('--all')) {
        await runSql(DB_SCHEMA_PATH);
        await runSql(DB_SAMPLE_DATA_PATH);
    } else {
        console.log('Usage: ts-node runSqlOnSupabase.ts [--schema|--sample-data|--all]');
        console.log('  --schema: Run schema creation SQL');
        console.log('  --sample-data: Run sample data insertion SQL');
        console.log('  --all: Run both schema and sample data SQL in sequence');
    }
}

main(); 