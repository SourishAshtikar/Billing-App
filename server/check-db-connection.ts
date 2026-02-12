import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkConnection() {
    try {
        console.log('Testing connection with URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
        await prisma.$connect();
        console.log('Connected to database successfully.');

        const count = await prisma.user.count();
        console.log('User count:', count);

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@test.com' }
        });
        console.log('Admin user found:', !!admin);

    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConnection();
