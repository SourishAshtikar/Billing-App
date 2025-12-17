
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Fetching All Leaves ---");
    const leaves = await prisma.leave.findMany();
    console.log(`Found ${leaves.length} leaves.`);
    leaves.forEach(l => {
        console.log(`Leave: User=${l.userId}, Date=${l.date.toISOString()}, Local=${l.date.toString()}, isHalfDay=${l.isHalfDay}`);
    });

    if (leaves.length === 0) {
        console.log("No leaves found. Cannot debug matching logic.");
        return;
    }

    // Pick the first leave to test matching logic
    const testLeave = leaves[0];
    const testDate = new Date(testLeave.date);
    const month = testDate.getMonth();
    const year = testDate.getFullYear();
    const day = testDate.getDate(); // This is local day

    console.log(`\n--- Testing Matching Logic for Leave Date: ${testDate.toISOString()} ---`);
    console.log(`Derived Month: ${month}, Year: ${year}, Day: ${day}`);

    // Simulation of billingController loop
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const businessDaysSet = new Set<string>();

    console.log(`Looping for Year=${year}, Month=${month} (0-indexed)...`);

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        // billingController uses: date.toISOString().split('T')[0]
        const isoKey = date.toISOString().split('T')[0];

        // Let's also try "Local String" key or just compare components
        // console.log(`  Loop Day ${i}: Local=${date.toString()} -> ISO Key=${isoKey}`);

        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            businessDaysSet.add(isoKey);
        }
    }

    const leaveKey = testDate.toISOString().split('T')[0];
    console.log(`Leave ISO Key: ${leaveKey}`);

    if (businessDaysSet.has(leaveKey)) {
        console.log("MATCH FOUND! Logic should work.");
    } else {
        console.log("MATCH FAILED! The keys do not match.");
        console.log("Potential reason: Timezone shift.");

        // Show what *was* in the set around that date
        console.log("Business Days Set sample (first 5):", Array.from(businessDaysSet).slice(0, 5));

        // Check if adjacent keys exist
        const prevDate = new Date(testDate); prevDate.setDate(prevDate.getDate() - 1);
        const nextDate = new Date(testDate); nextDate.setDate(nextDate.getDate() + 1);
        console.log(`Check Prev (${prevDate.toISOString().split('T')[0]}): ${businessDaysSet.has(prevDate.toISOString().split('T')[0])}`);
        console.log(`Check Next (${nextDate.toISOString().split('T')[0]}): ${businessDaysSet.has(nextDate.toISOString().split('T')[0])}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
