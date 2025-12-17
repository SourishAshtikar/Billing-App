import { Request, Response } from 'express';
import prisma from '../db';

// Removed local initialization


// Get all projects
export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                _count: {
                    select: { resources: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};

// Create a new project
export const createProject = async (req: Request, res: Response) => {
    try {
        const { code, name, description, startDate, endDate, status, po, lineItem } = req.body;

        const existingProject = await prisma.project.findUnique({
            where: { code }
        });

        if (existingProject) {
            return res.status(400).json({ message: 'Project code already exists' });
        }

        const project = await prisma.project.create({
            data: {
                code,
                name,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                status: status || 'ACTIVE',
                po,
                lineItem
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating project', error });
    }
};

// Get single project
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                resources: {
                    include: { user: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
};

// Update a project
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, description, startDate, endDate, status, po, lineItem } = req.body;

        const project = await prisma.project.update({
            where: { id },
            data: {
                code,
                name,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                status, // ACTIVE/INACTIVE
                po,
                lineItem
            }
        });

        res.json(project);
    } catch (error: any) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Error updating project', error: error.message });
    }
};

// Delete a project
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Optional: Check if project has resources or billing data before deleting
        // For cascading delete, ensure schema supports it or delete manually

        await prisma.projectResource.deleteMany({
            where: { projectId: id }
        });

        await prisma.project.delete({
            where: { id }
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
};

// Remove resource from project
export const removeResourceFromProject = async (req: Request, res: Response) => {
    try {
        const { projectId, userId } = req.params;

        await prisma.projectResource.delete({
            where: {
                projectId_userId: {
                    projectId,
                    userId
                }
            }
        });

        res.json({ message: 'Resource removed from project successfully' });
    } catch (error: any) {
        console.error('Error removing resource from project:', error);
        res.status(500).json({ message: 'Error removing resource from project', error: error.message });
    }
};
