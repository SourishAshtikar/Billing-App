import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('db.ts initialized. DB URL:', connectionString?.split('@')[1] || 'Not Set');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
