import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

interface DecodedToken {
    id: string;
    iat: number;
    exp: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    console.log('protect middleware - cookies:', Object.keys(req.cookies));
    // Check for token in cookies
    if (req.cookies.jwt) {
        try {
            token = req.cookies.jwt;
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123') as DecodedToken;

            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
                select: { id: true, name: true, email: true, role: true, empId: true, joiningDate: true }, // Exclude password
            });

            if (!user) {
                console.log('protect middleware - user not found');
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            console.log('protect middleware - user authenticated:', user.email, user.role);
            // Attach user to request object
            // @ts-ignore
            req.user = user;
            next();
        } catch (error) {
            console.error('protect middleware - token verification failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        console.log('protect middleware - no token found');
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    console.log('admin middleware - user role:', req.user?.role);
    // @ts-ignore
    if (req.user && req.user.role === 'ADMIN') {
        console.log('admin middleware - access granted');
        next();
    } else {
        console.log('admin middleware - access denied');
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};
