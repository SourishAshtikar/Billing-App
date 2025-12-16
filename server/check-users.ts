
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

import prisma from './src/db';

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true,
            name: true
        }
    });

    console.log('Found users:', users);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
