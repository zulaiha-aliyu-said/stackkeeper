import { pool } from './db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function addInterfaceModeColumn() {
    try {
        console.log('Adding interface_mode column to users table...');

        // Add the column if it doesn't exist
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS interface_mode TEXT DEFAULT 'simple'
        `);

        console.log('✅ Successfully added interface_mode column');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding column:', error);
        process.exit(1);
    }
}

addInterfaceModeColumn();
