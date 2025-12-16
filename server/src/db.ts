import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') }); // src/../.env

const connectionString = process.env.DATABASE_URL;
console.log('db.ts initialized. DB URL:', connectionString?.split('@')[1]);

if (!connectionString) {
    console.error('CRITICAL ERROR: DATABASE_URL is not defined in environment variables.');
    // Don't throw immediately to allow app to start logging, but this is fatal
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
