
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.project.findMany({
        include: {
            resources: true
        },
        take: 1
    });

    if (projects.length === 0) {
        console.log('No projects found');
        return;
    }

    const project = projects[0];
    console.log('Project:', project.name);
    console.log('Resources:', JSON.stringify(project.resources, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
