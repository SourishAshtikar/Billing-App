
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst();
    const user = await prisma.user.findFirst({ where: { role: 'RESOURCE' } });

    console.log('Project ID:', project?.id);
    console.log('User ID:', user?.id);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
