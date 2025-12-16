import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
console.log('DB URL:', connectionString?.split('@')[1]); // Log host/db only for safety

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testLogin() {
    const email = 'admin@test.com';
    const password = 'admin';

    console.log(`Attempting login for: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User NOT found in database.');
            return;
        }

        console.log('User found:', user.id, user.name, user.role);
        console.log('Stored hashed password:', user.password);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (isMatch) {
            console.log('LOGIN SUCCESS! Credentials are valid.');
        } else {
            console.log('LOGIN FAILED! Password mismatch.');
            // Test if we can hash 'admin' and match it manually (sanity check)
            const testHash = await bcrypt.hash(password, 10);
            console.log('Test hash of "admin":', testHash);
        }

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
