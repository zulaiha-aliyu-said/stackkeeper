import { pool } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
    try {
        console.log('Connecting to database...');
        // Simple query to verify connection first
        const timeRes = await pool.query('SELECT NOW()');
        console.log('Database connected at:', timeRes.rows[0].now);

        const sqlPath = path.resolve(__dirname, '../database_schema.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error('Schema file not found at:', sqlPath);
            return;
        }
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration schema...');
        await pool.query(sql);
        console.log('Migration completed successfully. Users table should be created.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
