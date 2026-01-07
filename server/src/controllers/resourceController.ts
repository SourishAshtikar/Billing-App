import { Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';

// Create a new resource
export const createResource = async (req: Request, res: Response) => {
    try {
        console.log('Create resource request body:', req.body);
        const { empId, name, email, joiningDate } = req.body;

        // Validate required fields
        if (!empId || !name || !email || !joiningDate) {
            console.log('Missing required fields:', { empId: !!empId, name: !!name, email: !!email, joiningDate: !!joiningDate });
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check for existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { empId }
                ]
            }
        });

        if (existingUser) {
            console.log('User already exists:', existingUser.email);
            return res.status(400).json({ message: 'User with this Email or Emp ID already exists' });
        }

        const hashedPassword = await bcrypt.hash('welcome123', 10);

        console.log('Creating user with data:', { empId, name, email, joiningDate, role: 'RESOURCE' });
        const newResource = await prisma.user.create({
            data: {
                empId,
                name,
                email,
                joiningDate: new Date(joiningDate),
                password: hashedPassword,
                role: 'RESOURCE'
            }
        });

        console.log('Resource created successfully:', newResource.id);
        const { password, ...userWithoutPassword } = newResource;
        res.status(201).json(userWithoutPassword);
    } catch (error: any) {
        console.error('Error creating resource - Full error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Error creating resource',
            error: error.message || 'Unknown error'
        });
    }
};

// Assign a resource to a project
export const assignResource = async (req: Request, res: Response) => {
    try {
        console.log('assignResource request body:', req.body);
        const { projectId, userId, rate, rateType, startDate, currency } = req.body;
        console.log('DEBUG: startDate received:', startDate, 'Type:', typeof startDate);
        if (startDate) console.log('DEBUG: Parsed Date:', new Date(startDate));

        if (!projectId || !userId || !rate) {
            console.log('Missing required fields for assignment:', { projectId: !!projectId, userId: !!userId, rate: !!rate });
            return res.status(400).json({ message: 'Project ID, User ID, and Rate are required' });
        }

        console.log('Checking for existing assignment...');
        const existingAssignment = await prisma.projectResource.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId
                }
            }
        });

        if (existingAssignment) {
            console.log('Existing assignment found, updating rate...');
            // Update rate if already assigned
            const updated = await prisma.projectResource.update({
                where: { id: existingAssignment.id },
                data: {
                    rate,
                    rateType: rateType || 'HOURLY',
                    currency: currency || 'USD',
                    assignedDays: req.body.assignedDays !== undefined ? req.body.assignedDays : existingAssignment.assignedDays,
                    startDate: startDate ? new Date(startDate) : (existingAssignment as any).startDate
                } as any
            });
            console.log('Assignment updated successfully');
            return res.json(updated);
        }

        console.log('Creating new assignment...');
        const assignment = await prisma.projectResource.create({
            data: {
                projectId,
                userId,
                rate,
                rateType: rateType || 'HOURLY',
                currency: currency || 'USD',
                assignedDays: req.body.assignedDays || 0,
                startDate: startDate ? new Date(startDate) : new Date()
            } as any
        });

        console.log('Assignment created successfully:', assignment.id);
        res.status(201).json(assignment);
    } catch (error: any) {
        console.error('Error assigning resource - Full error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Error assigning resource',
            error: error.message || 'Unknown error'
        });
    }
};

// Update a resource
export const updateResource = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, empId, joiningDate } = req.body;

        console.log(`Updating resource ${id}:`, req.body);

        const resource = await prisma.user.findUnique({
            where: { id, role: 'RESOURCE' }
        });

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Check uniqueness if email/empId changed
        if (email !== resource.email || empId !== resource.empId) {
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { empId: empId }
                    ],
                    NOT: { id: id }
                }
            });

            if (existing) {
                return res.status(400).json({ message: 'Email or Emp ID already in use' });
            }
        }

        const updatedResource = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                empId,
                joiningDate: joiningDate ? new Date(joiningDate) : undefined
            }
        });

        const { password, ...userWithoutPassword } = updatedResource;
        res.json(userWithoutPassword);
    } catch (error: any) {
        console.error('Error updating resource:', error);
        res.status(500).json({ message: 'Error updating resource', error: error.message });
    }
};

// Delete a resource
export const deleteResource = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        console.log(`Deleting resource ${id}`);

        // Check if resource exists
        const resource = await prisma.user.findUnique({
            where: { id, role: 'RESOURCE' }
        });

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Check references before deleting (optional - could cascade or block)
        // For now, we'll try to delete and let DB constraints handle it, or handle known relations

        // Delete assignments first (or use cascade in schema if set)
        await prisma.projectResource.deleteMany({
            where: { userId: id }
        });

        await prisma.leave.deleteMany({
            where: { userId: id }
        });

        await prisma.user.delete({
            where: { id }
        });

        res.json({ message: 'Resource deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ message: 'Error deleting resource', error: error.message });
    }
};

// Calculate working days for a resource (excluding weekends and leaves)
export const getResourceWorkingDays = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: 'Month and Year are required' });
        }

        const targetMonth = parseInt(month as string); // 0-indexed month from frontend
        const targetYear = parseInt(year as string);

        // Calculate total days in month
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // Start date: 1st of the month at 00:00:00
        const startDate = new Date(targetYear, targetMonth, 1);

        // End date: Last day of the month at 23:59:59.999
        // This ensures match for any time on the last day
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        endDate.setHours(23, 59, 59, 999);

        // Get leaves for this user in this month
        const leaves = await prisma.leave.findMany({
            where: {
                userId: id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Calculate daily breakdown
        const dailyBreakdown = [];
        let cumulativeWorkingDays = 0;
        let totalWorkingDays = 0;

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(targetYear, targetMonth, i);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            // Robust Date Comparison
            // Compare YYYY-MM-DD strings to ignore time/timezone discrepancies
            const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Check if leave
            const leaveEntry = leaves.find((l: any) => {
                const leaveDate = new Date(l.date);
                const leaveDateStr = leaveDate.toISOString().split('T')[0];
                return leaveDateStr === dateStr;
            });

            const isLeave = !!leaveEntry;
            const isHalfDay = leaveEntry?.isHalfDay || false;
            // Capture details
            const reason = leaveEntry?.reason || '';
            const isMandatory = leaveEntry?.isMandatory || false;

            let status = 'WORKING';

            // Logic: Weekends take precedence over leaves for "Working Day" calculation
            // If it's a weekend, it's NOT a working day, regardless of leave status.
            // If it's a weekday, check for leave.

            if (isWeekend) {
                status = 'WEEKEND';
            } else if (isLeave) {
                status = isHalfDay ? 'HALF_DAY' : 'LEAVE';
            }

            if (status === 'WORKING') {
                cumulativeWorkingDays++;
            } else if (status === 'HALF_DAY') {
                cumulativeWorkingDays += 0.5;
            }

            if (!isWeekend) {
                totalWorkingDays++;
            }

            dailyBreakdown.push({
                day: i,
                date: dateStr, // Use pre-calculated dateStr to avoid timezone shifts
                status,
                cumulative: cumulativeWorkingDays,
                reason,       // New field
                isMandatory   // New field
            });
        }

        // Calculate stats from breakdown
        // Count actual leave deduction
        // FIX: Ensure we only count leaves that fell on working days (Status 'LEAVE' or 'HALF_DAY')
        // Leaves on weekends would have status 'WEEKEND' and thus are excluded here.
        const leaveDaysCount = dailyBreakdown.reduce((acc, d) => {
            if (d.status === 'LEAVE') return acc + 1;
            if (d.status === 'HALF_DAY') return acc + 0.5;
            return acc;
        }, 0);

        const actualWorkingDays = cumulativeWorkingDays;

        const now = new Date();
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31);

        // Helper to get business days in a month
        const getBusinessDaysInMonth = (m: number, y: number) => {
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            let count = 0;
            for (let i = 1; i <= daysInMonth; i++) {
                const day = new Date(y, m, i).getDay();
                if (day !== 0 && day !== 6) count++;
            }
            return count;
        };

        // Get total assigned days (Budget)
        const assignments = await prisma.projectResource.findMany({
            where: {
                userId: id,
                OR: [
                    { startDate: null },
                    { startDate: { lte: endOfYear } }
                ]
            }
        });
        const totalAnnualAssigned = assignments.reduce((acc: number, curr: any) => acc + (curr.assignedDays || 0), 0);

        // Calculate exhausted days for the whole year (Business days - Leaves)
        const allYearLeaves = await prisma.leave.findMany({
            where: {
                userId: id,
                date: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            }
        });

        const totalAppliedAnnual = allYearLeaves.reduce((acc: number, l: any) => acc + (l.isHalfDay ? 0.5 : 1), 0);

        // Calculate Exhausted YTD proportionally
        // Exhausted = Sum over months M <= current of (AllocatedInM * (ActualWorkedInM / BusinessDaysInM))
        let annualExhausted = 0;
        const currentMonth = targetYear === now.getFullYear() ? now.getMonth() : (targetYear < now.getFullYear() ? 11 : -1);

        if (currentMonth >= 0) {
            for (let m = 0; m <= currentMonth; m++) {
                const bizDays = getBusinessDaysInMonth(m, targetYear);
                const monthLeaves = allYearLeaves.filter(l => new Date(l.date).getMonth() === m);
                const leaveDays = monthLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);

                // If it's the current month, we only count business days up to today
                let businessDaysPassed = bizDays;
                let actualWorkedInMonth = bizDays - leaveDays;

                if (m === now.getMonth() && targetYear === now.getFullYear()) {
                    // Count business days passed so far in current month
                    businessDaysPassed = 0;
                    for (let d = 1; d <= now.getDate(); d++) {
                        const dayOfWeek = new Date(targetYear, m, d).getDay();
                        if (dayOfWeek !== 0 && dayOfWeek !== 6) businessDaysPassed++;
                    }
                    // Actual worked so far in this month is (Business Days Passed - Leaves Taken So Far)
                    // (Assuming allYearLeaves already filtered for this month)
                    actualWorkedInMonth = businessDaysPassed - leaveDays;
                }

                // Contribution to exhaustion = (ActualWorked / BusinessDaysTotal) * Allocated
                // We use bizDays as the denominator to represent the full month's capacity
                // BUT if we only want to show "how much of the ALREADY PASSED days are exhausted":
                // Exhausted = (Percentage of month passed) * Allocated - Leaves? No.
                // Simpler: Exhausted is the portion of the Yearly Total that "should have been worked"
                // minus the impact of leaves.

                // Let's use the Ratio approach:
                // If a month has 20 biz days and 10 allocated days.
                // Working 20 days = 10 exhausted.
                // Working 10 days = 5 exhausted.
                const monthAllocation = totalAnnualAssigned / 12; // Assuming even distribution if not monthly
                // Actually, totalAnnualAssigned IS the sum of all assignments.
                // Let's just use the business days worked as the direct exhaust if we want it "based on total".
                // User said: "Worked YTD & Remaining should be calculated based on the Yearly total"
                // This likely means: Worked YTD = (Actual Worked Business Days / Total Annual Business Days) * Yearly Total.

                if (m < currentMonth || (m === currentMonth && targetYear === now.getFullYear())) {
                    // For completed months or current month up to now
                    // We'll calculate it in a cleaner way below outside the loop for simplicity
                }
            }
        }

        // Revised Proportional Logic:
        const totalBizDaysYear = Array.from({ length: 12 }, (_, i) => getBusinessDaysInMonth(i, targetYear)).reduce((a, b) => a + b, 0);

        let bizDaysWorkedYTD = 0;
        const endOfYTD = targetYear === now.getFullYear() ? now : endOfYear;
        if (targetYear <= now.getFullYear()) {
            for (let d = new Date(targetYear, 0, 1); d <= endOfYTD; d.setDate(d.getDate() + 1)) {
                const day = d.getDay();
                if (day !== 0 && day !== 6) {
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const leaveEntry = allYearLeaves.find(l => {
                        const ld = new Date(l.date);
                        const ldStr = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
                        return ldStr === dateStr;
                    });
                    const isLeave = !!leaveEntry;
                    const isHalfDay = leaveEntry?.isHalfDay || false;
                    bizDaysWorkedYTD += isLeave ? (isHalfDay ? 0.5 : 0) : 1;
                }
            }
        }

        // Exhausted = Actual Worked Business Days (Attendance so far)
        // Remained = Budget (allocated) - Attendance so far
        annualExhausted = bizDaysWorkedYTD;

        res.json({
            month: targetMonth,
            year: targetYear,
            monthlyStats: {
                totalDays: daysInMonth,
                businessDays: totalWorkingDays,
                workedDays: actualWorkingDays,
                leaveDays: leaveDaysCount,
            },
            annualStats: {
                year: targetYear,
                allocated: totalAnnualAssigned,
                exhausted: annualExhausted,
                remained: totalAnnualAssigned - annualExhausted,
                totalApplied: totalAppliedAnnual
            },
            dailyBreakdown
        });

    } catch (error: any) {
        console.error('Error calculating working days:', error);
        res.status(500).json({ message: 'Error calculating working days', error: error.message });
    }
};

// Get all resources with stats
export const getResources = async (req: Request, res: Response) => {
    try {
        const resources = await prisma.user.findMany({
            where: { role: 'RESOURCE' },
            include: {
                resources: true, // Project Assignments
                leaves: true     // All leaves
            }
        });

        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);

        // Helper to calc business days between two dates
        const getBusinessDays = (start: Date, end: Date) => {
            let count = 0;
            let cur = new Date(start);
            while (cur <= end) {
                const day = cur.getDay();
                if (day !== 0 && day !== 6) count++;
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        };

        const totalBusinessDaysThisYear = getBusinessDays(startOfYear, endOfYear);

        const resourcesWithStats = resources.map((r: any) => {
            // Allocated Days (Active in Current Year)
            const allocatedDays = r.resources
                .filter((pr: any) => !pr.startDate || new Date(pr.startDate).getFullYear() <= now.getFullYear())
                .reduce((acc: number, curr: any) => acc + (curr.assignedDays || 0), 0);

            // Leaves Taken (This Year only)
            const leaves = r.leaves.filter((l: any) => {
                const leaveDate = new Date(l.date);
                return leaveDate.getFullYear() === now.getFullYear() && leaveDate <= now;
            });
            const leavesCount = leaves.reduce((acc: number, l: any) => acc + (l.isHalfDay ? 0.5 : 1), 0);

            // Available Working Days (Total Business Days - Leaves Taken)
            const availableWorkingDays = totalBusinessDaysThisYear - leavesCount;

            return {
                id: r.id,
                name: r.name,
                email: r.email,
                role: r.role,
                allocatedDays,
                leavesTaken: leavesCount,
                availableWorkingDays: availableWorkingDays.toFixed(1)
            };
        });

        res.json(resourcesWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resources', error });
    }
};

// Get monthly working days breakdown for all resources for a given year
export const getAnnualMonthlyBreakdown = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        if (!year) return res.status(400).json({ message: 'Year is required' });

        const targetYear = parseInt(year as string);
        const resources = await prisma.user.findMany({
            where: { role: 'RESOURCE' },
            include: {
                resources: true, // Project Assignments
                leaves: {
                    where: {
                        date: {
                            gte: new Date(targetYear, 0, 1),
                            lte: new Date(targetYear, 11, 31)
                        }
                    }
                }
            }
        });

        // Helper to get business days in a month
        const getBusinessDaysInMonth = (month: number, year: number) => {
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let count = 0;
            for (let i = 1; i <= daysInMonth; i++) {
                const day = new Date(year, month, i).getDay();
                if (day !== 0 && day !== 6) count++;
            }
            return count;
        };

        const now = new Date();
        now.setHours(23, 59, 59, 999); // Include today in YTD

        const result = resources.map(resource => {
            const monthlyBreakdown: any = {};
            let bizDaysWorkedYTD = 0;

            for (let m = 0; m < 12; m++) {
                const totalBusinessDays = getBusinessDaysInMonth(m, targetYear);
                const monthLeaves = resource.leaves.filter(l => {
                    const d = new Date(l.date);
                    return d.getMonth() === m && d.getFullYear() === targetYear;
                });
                const leaveDays = monthLeaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);

                monthlyBreakdown[m] = {
                    businessDays: totalBusinessDays,
                    leaveDays: leaveDays,
                    workingDays: totalBusinessDays - leaveDays
                };
            }

            // Calculate Total Assigned (Allocated Annually)
            const totalAssigned = resource.resources
                .filter((pr: any) => !pr.startDate || new Date(pr.startDate).getFullYear() <= targetYear)
                .reduce((acc: number, curr: any) => acc + (curr.assignedDays || 0), 0);

            // Calculate ratios for Worked YTD & Remaining based on Total Assigned
            const totalBizDaysYear = Array.from({ length: 12 }, (_, i) => getBusinessDaysInMonth(i, targetYear)).reduce((a: number, b: number) => a + b, 0);
            bizDaysWorkedYTD = 0;
            const endOfYTD = targetYear === now.getFullYear() ? now : new Date(targetYear, 11, 31, 23, 59, 59);

            if (targetYear <= now.getFullYear()) {
                for (let m = 0; m < 12; m++) {
                    const daysInMonth = new Date(targetYear, m + 1, 0).getDate();
                    for (let d = 1; d <= daysInMonth; d++) {
                        const date = new Date(targetYear, m, d);
                        if (date > endOfYTD) break;
                        const dayOfWeek = date.getDay();
                        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                        const dateStr = `${targetYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const leaveEntry = resource.leaves.find(l => {
                            const ld = new Date(l.date);
                            const ldStr = `${ld.getFullYear()}-${String(ld.getMonth() + 1).padStart(2, '0')}-${String(ld.getDate()).padStart(2, '0')}`;
                            return ldStr === dateStr;
                        });

                        const isLeave = !!leaveEntry;
                        const isHalfDay = leaveEntry?.isHalfDay || false;
                        bizDaysWorkedYTD += isLeave ? (isHalfDay ? 0.5 : 0) : 1;
                    }
                }
            }

            const workedYTD = bizDaysWorkedYTD;
            const remainingDays = totalAssigned - workedYTD;

            return {
                id: resource.id,
                name: resource.name,
                empId: resource.empId,
                monthlyBreakdown,
                workedYTD,
                remainingDays,
                totalAssigned
            };
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching annual breakdown:', error);
        res.status(500).json({ message: 'Error fetching annual breakdown', error: error.message });
    }
};
