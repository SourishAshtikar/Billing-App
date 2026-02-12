import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function createDb() {
    // Connect to 'postgres' database to create new DB
    const maintenanceUrl = process.env.DATABASE_URL?.replace(/\/([^/?]+)(\?|$)/, '/postgres$2');
    console.log('Connecting to maintenance DB:', maintenanceUrl?.replace(/:[^:@]*@/, ':****@'));

    const client = new Client({ connectionString: maintenanceUrl });

    try {
        await client.connect();

        // Check if DB exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'billing_db'");
        if (res.rows.length > 0) {
            console.log('Database billing_db already exists.');
        } else {
            console.log('Creating database billing_db...');
            await client.query('CREATE DATABASE "billing_db"');
            console.log('Database created successfully!');
        }
    } catch (err: any) {
        console.error('Error creating database:', err);
        // If auth failed here, we know credentials are wrong
        if (err.code === '28P01') {
            console.error('AUTHENTICATION FAILED. Please check your password in .env');
        }
    } finally {
        await client.end();
    }
}

createDb();
