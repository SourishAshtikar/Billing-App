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
