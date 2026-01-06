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
                date: date.toISOString().split('T')[0],
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

        // --- Annual Stats Calculation ---
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfCalc = new Date(); // Up to today for exhausted calculation
        // If viewing past year, end at Dec 31
        if (targetYear < new Date().getFullYear()) {
            endOfCalc.setFullYear(targetYear, 11, 31);
        }

        // Get total assigned days from all projects (Allocated Annually)
        // Filter assignments that are active in the target year
        const assignments = await prisma.projectResource.findMany({
            where: {
                userId: id,
                OR: [
                    { startDate: null },
                    {
                        startDate: {
                            lte: new Date(targetYear, 11, 31)
                        }
                    }
                ]
            }
        });
        const totalAnnualAssigned = assignments.reduce((acc: number, curr: any) => acc + (curr.assignedDays || 0), 0);

        // Calculate exhausted days for the whole year (Business days - Leaves)
        // We need all leaves for the year
        const allYearLeaves = await prisma.leave.findMany({
            where: {
                userId: id,
                date: {
                    gte: startOfYear,
                    lte: new Date(targetYear, 11, 31)
                }
            }
        });

        let annualExhausted = 0;
        const currentDayOfYear = Math.floor((endOfCalc.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

        // Loop through every day of year up to 'now' to count working days
        // Optimization: rough calc or detailed loop. Detailed loop is safer.
        for (let d = new Date(targetYear, 0, 1); d <= endOfCalc; d.setDate(d.getDate() + 1)) {
            const day = d.getDay();
            const isWeekend = day === 0 || day === 6;

            if (!isWeekend) {
                // Check leave
                const leaveEntry = allYearLeaves.find((l: any) => {
                    const ld = new Date(l.date);
                    return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth();
                });

                const isLeave = !!leaveEntry;
                const isHalfDay = leaveEntry?.isHalfDay || false;

                if (isLeave) {
                    if (isHalfDay) {
                        annualExhausted += 0.5;
                    } else {
                        annualExhausted += 1;
                    }
                }
            }
        }

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
                remained: totalAnnualAssigned - annualExhausted
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

        const result = resources.map(resource => {
            const monthlyBreakdown: any = {};

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

            return {
                id: resource.id,
                name: resource.name,
                empId: resource.empId,
                monthlyBreakdown
            };
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching annual breakdown:', error);
        res.status(500).json({ message: 'Error fetching annual breakdown', error: error.message });
    }
};
