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

        const targetMonth = parseInt(month as string) - 1; // Convert to 0-indexed month
        const targetYear = parseInt(year as string);

        // Calculate total days in month
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

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

            // Check if leave
            const isLeave = leaves.some(l => {
                const leaveDate = new Date(l.date);
                return leaveDate.getDate() === i && leaveDate.getMonth() === targetMonth && leaveDate.getFullYear() === targetYear;
            });

            let status = 'WORKING';
            if (isWeekend) status = 'WEEKEND';
            if (isLeave) status = 'LEAVE';

            if (status === 'WORKING') {
                cumulativeWorkingDays++;
            }
            if (!isWeekend) {
                totalWorkingDays++;
            }

            dailyBreakdown.push({
                day: i,
                date: date.toISOString().split('T')[0],
                status,
                cumulative: cumulativeWorkingDays
            });
        }

        // Calculate stats from breakdown
        const leaveDaysCount = dailyBreakdown.filter(d => d.status === 'LEAVE').length;
        const actualWorkingDays = cumulativeWorkingDays;

        // --- Annual Stats Calculation ---
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfCalc = new Date(); // Up to today for exhausted calculation
        // If viewing past year, end at Dec 31
        if (targetYear < new Date().getFullYear()) {
            endOfCalc.setFullYear(targetYear, 11, 31);
        }

        // Get total assigned days from all projects (Allocated Annually)
        // Note: usage of 'assignedDays' as 'Annual Budget' is an assumption based on user context "Annually allocated project days"
        const assignments = await prisma.projectResource.findMany({
            where: { userId: id }
        });
        const totalAnnualAssigned = assignments.reduce((acc, curr) => acc + (curr.assignedDays || 0), 0);

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
            if (day !== 0 && day !== 6) {
                // Check leave
                const isLeave = allYearLeaves.some(l => {
                    const ld = new Date(l.date);
                    return ld.getDate() === d.getDate() && ld.getMonth() === d.getMonth();
                });
                if (!isLeave) {
                    annualExhausted++;
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

        const resourcesWithStats = resources.map(r => {
            // Allocated Days
            const allocatedDays = r.resources.reduce((acc, curr) => acc + (curr.assignedDays || 0), 0);

            // Leaves Taken (Till Date)
            const leaves = r.leaves.filter(l => new Date(l.date) <= now && new Date(l.date) >= startOfYear);
            const leavesCount = leaves.reduce((acc, l) => acc + (l.isHalfDay ? 0.5 : 1), 0);

            // Available Working Days (Total Business Days - Leaves Taken)
            // Or maybe "Remaining Business Days in Year"? 
            // "Available working days" usually means capacity. 
            // Let's interpret as: "Total Potential Working Days (Year) - Leaves Taken" 
            // OR "Allocated - Billed"?
            // Reading user request: "Number of days allocated to project, Number of leaves taken till date, Available working days"
            // "Available Working Days" likely means "Total Business Days (YTD or Year) - Leaves".
            // Let's provide "Total Business Days (Year) - Leaves Taken" as 'availableWorkingDays'.

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
