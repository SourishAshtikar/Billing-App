import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@db:5432/db';

const pool = new Pool({ connectionString });

console.log('DB Config:', {
  connectionString: connectionString?.replace(/:[^:@]*@/, ':****@'),
});

pool.connect().then(client => {
  console.log('DB Pool Connected successfully');
  client.release();
}).catch(err => {
  console.error('DB Pool Connection failed:', err);
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'production' ? [] : ['query', 'info', 'warn', 'error'],
});

export default prisma;
