
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copy-paste the calculateBillableDays logic to test it in isolation
const calculateBillableDays = async (userId: string, month: number, year: number) => {
    console.log(`Debug Days: Year=${year}, Month=${month} (UTC Based)`);
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    console.log(`Days in Month: ${daysInMonth}`);

    let totalBusinessDays = 0;
    const businessDaysSet = new Set<string>();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(Date.UTC(year, month, i));
        const dayOfWeek = date.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalBusinessDays++;
            businessDaysSet.add(date.toISOString().split('T')[0]);
        }
    }
    console.log(`Total Business Days: ${totalBusinessDays}`);

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));

    const leaves = await prisma.leave.findMany({
        where: {
            userId: userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    console.log(`Leaves Found: ${leaves.length}`);

    let leaveDaysCount = 0;
    for (const leave of leaves) {
        const dateStr = new Date(leave.date).toISOString().split('T')[0];
        console.log(`Checking Leave: ${dateStr}, isHalfDay=${leave.isHalfDay}`);

        if (businessDaysSet.has(dateStr)) {
            const val = leave.isHalfDay ? 0.5 : 1;
            console.log(`  -> Is Business Day. Deducting ${val}`);
            leaveDaysCount += val;
        } else {
            console.log(`  -> Not a business day.`);
        }
    }

    return {
        totalBusinessDays,
        actualBillableDays: Math.max(0, totalBusinessDays - leaveDaysCount),
        leaveDaysCount
    };
};

async function main() {
    // 1. Fetch a user and project resource
    const project = await prisma.project.findFirst({
        include: { resources: { include: { user: true } } }
    });

    if (!project || project.resources.length === 0) {
        console.log("No project/resources found.");
        return;
    }

    const pr = project.resources[0];
    const userId = pr.userId;
    console.log(`Testing for User: ${pr.user.name} (${userId})`);
    console.log(`Rate: ${pr.rate}, Type: ${pr.rateType}`);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 2. Run Calc
    const stats = await calculateBillableDays(userId, currentMonth, currentYear);
    console.log("Stats:", stats);

    // 3. Calc Cost
    const rate = Number(pr.rate);
    let cost = 0;
    if (pr.rateType === 'DAILY') {
        cost = stats.actualBillableDays * rate;
    } else {
        cost = stats.actualBillableDays * 8 * rate;
    }
    console.log(`Calculated Cost: ${cost}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
