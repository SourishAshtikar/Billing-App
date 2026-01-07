import { Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcryptjs';

/**
 * Create a new user
 * POST /api/users
 * Protected (Admin only)
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, empId, joiningDate } = req.body;

        // Basic validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                empId,
                joiningDate: joiningDate ? new Date(joiningDate) : null
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                empId: true,
                joiningDate: true,
                createdAt: true
            }
        });

        res.status(201).json(newUser);
    } catch (error: any) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

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
/**
 * Update a user
 * PUT /api/users/:id
 * Protected (Admin only)
 */
export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, empId, joiningDate } = req.body;

        // Validate role if provided
        if (role) {
            const validRoles = ['ADMIN', 'MANAGER', 'RESOURCE', 'ADMIN_VIEWER'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ message: 'Invalid role' });
            }
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                empId,
                joiningDate: joiningDate ? new Date(joiningDate) : undefined
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                empId: true,
                joiningDate: true,
            }
        });

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};
