import { Request, Response } from 'express';
import prisma from '../db';

// Apply for leave (or mark leave)
export const applyLeave = async (req: Request, res: Response) => {
    try {
        const { date, reason, isHalfDay } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        const existingLeave = await prisma.leave.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: new Date(date)
                }
            }
        });

        if (existingLeave) {
            // If it exists, currently we toggle off (delete).
            // NOTE: If complex update logic is needed (e.g. changing full to half), we might need more logic.
            // For now, retaining toggle behavior.
            await prisma.leave.delete({
                where: { id: existingLeave.id }
            });
            return res.json({ message: 'Leave removed' });
        }

        const leave = await prisma.leave.create({
            data: {
                userId,
                date: new Date(date),
                reason,
                isHalfDay: isHalfDay || false
            }
        });

        res.status(201).json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Error marking leave', error });
    }
};

// Mark mandatory leave (Admin only)
export const adminMarkLeave = async (req: Request, res: Response) => {
    try {
        const { userId, date, reason, isHalfDay, isMandatory } = req.body;

        if (!userId || !date) {
            return res.status(400).json({ message: 'User ID and Date are required' });
        }

        const existingLeave = await prisma.leave.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: new Date(date)
                }
            }
        });

        if (existingLeave) {
            const updated = await prisma.leave.update({
                where: { id: existingLeave.id },
                data: {
                    reason,
                    isHalfDay: isHalfDay !== undefined ? isHalfDay : existingLeave.isHalfDay,
                    isMandatory: isMandatory !== undefined ? isMandatory : existingLeave.isMandatory
                }
            });
            return res.json(updated);
        }

        const leave = await prisma.leave.create({
            data: {
                userId,
                date: new Date(date),
                reason,
                isHalfDay: isHalfDay || false,
                isMandatory: isMandatory || false
            }
        });

        res.status(201).json(leave);
    } catch (error: any) {
        res.status(500).json({ message: 'Error marking admin leave', error: error.message });
    }
};

// Remove a leave
export const removeLeave = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // @ts-ignore
        const user = req.user;

        const leave = await prisma.leave.findUnique({
            where: { id }
        });

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        // Only admin can remove mandatory leaves
        if (leave.isMandatory && user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Only admins can remove mandatory leaves' });
        }

        // Users can only remove their own leaves unless they are admin
        if (leave.userId !== user.id && user.role !== 'ADMIN') {
            return res.status(401).json({ message: 'Not authorized to remove this leave' });
        }

        await prisma.leave.delete({
            where: { id }
        });

        res.json({ message: 'Leave removed successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error removing leave', error: error.message });
    }
};

// Help to get leaves for a specific user (Admin/Manager use)
export const getUserLeaves = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const leaves = await prisma.leave.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });
        res.json(leaves);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching user leaves', error: error.message });
    }
};

// Get my leaves
export const getMyLeaves = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const leaves = await prisma.leave.findMany({
            where: { userId },
            orderBy: { date: 'desc' }
        });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaves', error });
    }
};

