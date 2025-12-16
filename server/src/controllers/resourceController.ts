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
        const { projectId, userId, rate, rateType, startDate } = req.body;
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
                    assignedDays: req.body.assignedDays !== undefined ? req.body.assignedDays : existingAssignment.assignedDays,
                    startDate: startDate ? new Date(startDate) : existingAssignment.startDate
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

        const targetMonth = parseInt(month as string);
        const targetYear = parseInt(year as string);

        // Calculate total days in month
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        let totalWorkingDays = 0;
        const workingDaysArray = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(targetYear, targetMonth, i);
            const dayOfWeek = date.getDay();
            // 0 = Sunday, 6 = Saturday. Assume Mon-Fri are working days.
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                totalWorkingDays++;
                workingDaysArray.push(i);
            }
        }

        // Get leaves for this user in this month
        // Get leaves for this user in this month
        // Leave model is per-day entries
        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const leaves = await prisma.leave.findMany({
            where: {
                userId: id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        // Calculate leave days (count business days that are leaves)
        let leaveDaysCount = 0;
        for (const leave of leaves) {
            const d = new Date(leave.date);
            const day = d.getDay();
            if (d.getMonth() === targetMonth && day !== 0 && day !== 6) {
                leaveDaysCount++;
            }
        }

        const actualWorkingDays = totalWorkingDays - leaveDaysCount;

        // Get total assigned days from all projects
        const assignments = await prisma.projectResource.findMany({
            where: { userId: id }
        });
        const totalAssignedDays = assignments.reduce((acc, curr) => acc + (curr.assignedDays || 0), 0);

        res.json({
            month: targetMonth,
            year: targetYear,
            totalBusinessDays: totalWorkingDays,
            leaveDays: leaveDaysCount,
            actualWorkingDays: actualWorkingDays,
            totalAssignedDays: totalAssignedDays,
            workingRatio: (actualWorkingDays / totalWorkingDays) * 100
        });

    } catch (error: any) {
        console.error('Error calculating working days:', error);
        res.status(500).json({ message: 'Error calculating working days', error: error.message });
    }
};

// Get all resources (Users with RESOURCE role)
export const getResources = async (req: Request, res: Response) => {
    try {
        const resources = await prisma.user.findMany({
            where: { role: 'RESOURCE' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching resources', error });
    }
};
