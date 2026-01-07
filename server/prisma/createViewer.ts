import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const email = 'viewer@test.com';
    const password = 'viewer';
    const hashedPassword = await bcrypt.hash(password, 10);

    const viewer = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN_VIEWER'
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Viewer User',
            role: 'ADMIN_VIEWER',
        },
    });

    console.log('Viewer user created/updated:', viewer.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
