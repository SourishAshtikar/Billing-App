import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('Testing connection to:', connectionString?.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

const pool = new Pool({ connectionString });

pool.connect()
    .then(client => {
        console.log('Connected successfully!');
        client.release();
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:');
        console.error(err);
        console.error('Code:', err.code);
        process.exit(1);
    });
