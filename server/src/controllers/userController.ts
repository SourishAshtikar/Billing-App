import { Request, Response } from 'express';
import prisma from '../db';

/**
 * Get all users with their roles
 * GET /api/users
 * Protected (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                empId: true,
                joiningDate: true,
                createdAt: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

/**
 * Update a user's role
 * PUT /api/users/:id/role
 * Protected (Admin only)
 */
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['ADMIN', 'MANAGER', 'RESOURCE'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update role
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            }
        });

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role', error: error.message });
    }
};
