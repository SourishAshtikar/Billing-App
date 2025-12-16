import { Request, Response } from 'express';
import prisma from '../db';

// Helper to calculate billable days for a specific period
const calculateBillableDays = async (userId: string, month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let totalBusinessDays = 0;
    const businessDaysSet = new Set<string>();

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalBusinessDays++;
            businessDaysSet.add(date.toISOString().split('T')[0]);
        }
    }

    // Get leaves (Leave model is per-day)
    // Filter by date range
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const leaves = await prisma.leave.findMany({
        where: {
            userId: userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    let leaveDaysCount = 0;
    for (const leave of leaves) {
        const dateStr = new Date(leave.date).toISOString().split('T')[0];
        if (businessDaysSet.has(dateStr)) {
            leaveDaysCount++;
        }
    }

    return Math.max(0, totalBusinessDays - leaveDaysCount);
};

// Get billing stats for a specific project
export const getProjectBillingStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { month, year } = req.query;

        // Default to current month if not provided
        const m = month ? parseInt(month as string) : new Date().getMonth();
        const y = year ? parseInt(year as string) : new Date().getFullYear();

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                resources: {
                    include: { user: true }
                }
            }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        let totalProjectCost = 0;
        const resourceStats = [];

        for (const pr of project.resources) {
            const billableDays = await calculateBillableDays(pr.userId, m, y);
            const rate = Number(pr.rate);
            let cost = 0;
            const rateType = (pr as any).rateType;

            if (rateType === 'DAILY') {
                cost = billableDays * rate;
            } else {
                // HOURLY default 8 hours
                cost = billableDays * 8 * rate;
            }

            totalProjectCost += cost;

            resourceStats.push({
                resourceId: pr.userId,
                resourceName: pr.user.name,
                rate: rate,
                rateType: rateType,
                billableDays,
                cost
            });
        }

        res.json({
            projectId: project.id,
            projectName: project.name,
            month: m,
            year: y,
            totalCost: totalProjectCost,
            resources: resourceStats
        });

    } catch (error: any) {
        console.error('Error calculating project billing:', error);
        res.status(500).json({ message: 'Error calculating project billing', error: error.message });
    }
};

// Get overview stats for all projects
export const getAllProjectsStats = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        const m = month ? parseInt(month as string) : new Date().getMonth();
        const y = year ? parseInt(year as string) : new Date().getFullYear();

        const projects = await prisma.project.findMany({
            include: {
                resources: true
            }
        });

        let grandTotal = 0;
        const projectStats = [];

        for (const project of projects) {
            let projectTotal = 0;
            let activeResources = 0;

            for (const pr of project.resources) {
                const billableDays = await calculateBillableDays(pr.userId, m, y);
                const rate = Number(pr.rate);
                let cost = 0;
                const rateType = (pr as any).rateType;

                if (rateType === 'DAILY') {
                    cost = billableDays * rate;
                } else {
                    cost = billableDays * 8 * rate;
                }
                projectTotal += cost;
                if (cost > 0) activeResources++;
            }

            grandTotal += projectTotal;
            projectStats.push({
                id: project.id,
                name: project.name,
                code: project.code,
                cost: projectTotal,
                resourceCount: project.resources.length
            });
        }

        res.json({
            month: m,
            year: y,
            grandTotal,
            projects: projectStats
        });

    } catch (error: any) {
        console.error('Error calculating overview stats:', error);
        res.status(500).json({ message: 'Error calculating overview', error: error.message });
    }
};
// Get annual billing report (Monthly breakdown)
export const getAnnualBillingReport = async (req: Request, res: Response) => {
    try {
        const { year, projectId } = req.query;
        const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
        const targetProjectId = projectId as string | undefined;

        console.log(`Generating annual report for Year: ${targetYear}, Project: ${targetProjectId || 'ALL'}`);

        // Pre-fetch all necessary data to avoid N+1 inside loop if possible
        // But calculateBillableDays logic is complex with leaves/holidays, so we might loop per month.

        const monthlyData = [];

        // 12 months
        for (let month = 0; month < 12; month++) {
            // Logic similar to overview/project stats but aggregated per month

            // Define Date Range
            const startDate = new Date(targetYear, month, 1);
            const endDate = new Date(targetYear, month + 1, 0);

            let monthTotalCost = 0;

            // Fetch projects (either all or specific)
            // We fetch INSIDE loop or OUTSIDE? 
            // Resources might change? Schema implies assignment is static or we have date ranges?
            // ProjectResource has no end date, only startDate (which we added recently) & assignedAt.
            // We should check if resource was assigned before end of this month.

            const whereClause: any = {};
            if (targetProjectId && targetProjectId !== 'ALL') {
                whereClause.id = targetProjectId;
            }

            const projects = await prisma.project.findMany({
                where: whereClause,
                include: {
                    resources: {
                        include: { user: true }
                    }
                }
            });

            for (const project of projects) {
                for (const pr of project.resources) {
                    // Check if resource assignment started AFTER this month
                    // If pr.startDate > endDate of month, then skip.
                    let assignmentStart = pr.assignedAt;
                    if ((pr as any).startDate) {
                        assignmentStart = new Date((pr as any).startDate); // Prioritize the new startDate field
                    }

                    if (assignmentStart > endDate) {
                        continue;
                    }

                    const billableDays = await calculateBillableDays(pr.userId, month, targetYear);
                    const rate = Number(pr.rate);
                    let cost = 0;
                    const rateType = (pr as any).rateType;

                    if (rateType === 'DAILY') {
                        cost = billableDays * rate;
                    } else {
                        cost = billableDays * 8 * rate;
                    }
                    monthTotalCost += cost;
                }
            }

            monthlyData.push({
                monthIndex: month,
                monthName: new Date(targetYear, month).toLocaleString('default', { month: 'short' }),
                cost: monthTotalCost
            });
        }

        res.json({
            year: targetYear,
            projectId: targetProjectId,
            data: monthlyData
        });

    } catch (error: any) {
        console.error('Error generating annual report:', error);
        res.status(500).json({ message: 'Error generating annual report', error: error.message });
    }
};
