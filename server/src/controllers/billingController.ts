import { Request, Response } from 'express';
import prisma from '../db';

// Helper to calculate billable days for a specific period
const calculateBillableDays = async (userId: string, month: number, year: number) => {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    let totalBusinessDays = 0;
    const businessDaysSet = new Set<string>();

    for (let i = 1; i <= daysInMonth; i++) {
        // Construct date in UTC to match DB storage which is typically UTC
        const date = new Date(Date.UTC(year, month, i));
        const dayOfWeek = date.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            totalBusinessDays++;
            // This will now consistently produce YYYY-MM-DD in UTC
            businessDaysSet.add(date.toISOString().split('T')[0]);
        }
    }

    // Get leaves (Leave model is per-day)
    // Filter by date range using UTC
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));

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
        // Leave date from DB is already UTC (Prisma default)
        // new Date(leave.date) might interpret as local if string, but if object it's Date.
        // Safer to just use toISOString on the string/date object directly if it's already a Date object, 
        // or ensure it is treated as UTC.
        // Prisma returns Date object.
        const dateStr = new Date(leave.date).toISOString().split('T')[0];

        if (businessDaysSet.has(dateStr)) {
            if (leave.isHalfDay) {
                leaveDaysCount += 0.5;
            } else {
                leaveDaysCount += 1;
            }
        }
    }

    return {
        totalBusinessDays,
        actualBillableDays: Math.max(0, totalBusinessDays - leaveDaysCount),
        leaveDaysCount
    };
};

const calculateCumulativeDays = async (userId: string, projectId: string, startDate: Date) => {
    // Simple calc: Working days from start date to NOW
    // This is expensive if we do meaningful business day calc for potentially years.
    // For MVP, days between dates - weekends. Leaves are tricky to sum for all history without performance hit.
    // Let's do: (Today - StartDate) in days -> remove weekends estimate.

    const now = new Date();
    if (startDate > now) return 0;

    // Rough business days calc
    let count = 0;
    const cur = new Date(startDate);
    while (cur <= now) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count++;
        cur.setDate(cur.getDate() + 1);
    }

    // Deduct total leaves for this user in this range?
    // Optimization: Just count without leaves for 'Cumulative Working Days' or exact?
    // Requirement says "Cummulative working days", usually implies actual worked.
    // Let's limit to simple business days for performance unless requested otherwise.
    return count;
};

// Get billing stats for a specific project (or ALL)
export const getProjectBillingStats = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // 'ALL' or uuid
        const { month, year, period } = req.query; // period: 'MONTH' | 'YTD'

        // Default to current month if not provided
        const m = month ? parseInt(month as string) : new Date().getMonth();
        const y = year ? parseInt(year as string) : new Date().getFullYear();
        const isYTD = period === 'YTD';

        let projects = [];

        if (id === 'ALL') {
            projects = await prisma.project.findMany({
                where: { status: 'ACTIVE' },
                include: {
                    resources: {
                        include: { user: true }
                    }
                }
            });
        } else {
            const project = await prisma.project.findUnique({
                where: { id },
                include: {
                    resources: {
                        include: { user: true }
                    }
                }
            });
            if (!project) return res.status(404).json({ message: 'Project not found' });
            projects = [project];
        }

        let totalProjectCost = 0;
        const resourceStats: any[] = [];

        // Define time range for iteration
        // If YTD, start from month 0 to m. If MONTH, just m.
        const startMonth = isYTD ? 0 : m;
        const endMonth = m;

        // Flatten resources across all selected projects
        for (const project of projects) {
            for (const pr of project.resources) {
                // Determine currency from project or resource (assuming project level consistency or resource override)
                // For report, we might need normalized currency. For now keeping as is.

                let aggregatedCost = 0;
                let aggregatedExpectedDays = 0;
                let aggregatedActualDays = 0;
                // For Cumulative, it's always from start date to NOW, regardless of filtered view? 
                // Usually Cumulative field in report means "Life to date". 
                // "Actual Days" column in report implies "For the selected period".

                for (let currentM = startMonth; currentM <= endMonth; currentM++) {
                    const { totalBusinessDays, actualBillableDays } = await calculateBillableDays(pr.userId, currentM, y);

                    const rate = Number(pr.rate);
                    let cost = 0;
                    const rateType = (pr as any).rateType;

                    if (rateType === 'DAILY') {
                        cost = actualBillableDays * rate;
                    } else {
                        // HOURLY default 8 hours
                        cost = actualBillableDays * 8 * rate;
                    }

                    aggregatedCost += cost;
                    aggregatedExpectedDays += totalBusinessDays;
                    aggregatedActualDays += actualBillableDays;
                }

                totalProjectCost += aggregatedCost;

                // Cumulative Life-to-Date
                const cumulativeDays = await calculateCumulativeDays(pr.userId, project.id, (pr as any).startDate || pr.assignedAt);

                // Add or Merge resource stats?
                // If 'ALL' view, identifying duplicate resources across projects?
                // Usually report is "By Line Item per Project". So we keep project context.

                // Calculate leaves for this period (sum of filtered months)
                let totalLeavesInPeriod = 0;
                for (let currentM = startMonth; currentM <= endMonth; currentM++) {
                    const { leaveDaysCount } = await calculateBillableDays(pr.userId, currentM, y);
                    totalLeavesInPeriod += leaveDaysCount;
                }

                resourceStats.push({
                    resourceId: pr.userId,
                    resourceName: pr.user.name,
                    projectId: project.id,
                    projectName: project.name,
                    po: project.po || '-',
                    lineItem: project.lineItem || '-',
                    rate: Number(pr.rate), // For YTD, rate might change? Assuming static for MVP
                    rateType: (pr as any).rateType,
                    annualWorkingDays: pr.assignedDays || 0,
                    expectedWorkingDays: aggregatedExpectedDays,
                    actualWorkingDays: aggregatedActualDays,
                    cumulativeWorkingDays: cumulativeDays,
                    cost: aggregatedCost,
                    leavesTaken: totalLeavesInPeriod,
                    totalBilled: aggregatedCost, // In this period context
                    currency: (pr as any).currency || 'USD'
                });
            }
        }

        res.json({
            projectId: id,
            projectName: id === 'ALL' ? 'All Projects' : projects[0].name,
            period: isYTD ? 'YTD' : 'MONTH',
            month: m,
            year: y,
            totalProjectAmount: totalProjectCost,
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
            const res0 = project.resources[0] as any;
            const currency = (project.resources.length > 0 && res0.currency) ? res0.currency : 'USD';

            for (const pr of project.resources) {
                const { actualBillableDays } = await calculateBillableDays(pr.userId, m, y);
                const rate = Number(pr.rate);
                let cost = 0;
                const rateType = (pr as any).rateType;

                if (rateType === 'DAILY') {
                    cost = actualBillableDays * rate;
                } else {
                    cost = actualBillableDays * 8 * rate;
                }
                projectTotal += cost;
                if (cost > 0) activeResources++;
            }

            grandTotal += projectTotal;
            projectStats.push({
                id: project.id,
                name: project.name,
                code: project.code,
                currency, // Added currency
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

        console.log(`[Billing] Generating annual report for Year: ${targetYear}, Project: ${targetProjectId}`);

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
            let monthExpectedCost = 0;

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

                    const { totalBusinessDays, actualBillableDays } = await calculateBillableDays(pr.userId, month, targetYear);
                    const rate = Number(pr.rate);
                    let actualCost = 0;
                    let expectedCost = 0;
                    const rateType = (pr as any).rateType;

                    if (rateType === 'DAILY') {
                        actualCost = actualBillableDays * rate;
                        expectedCost = totalBusinessDays * rate;
                    } else {
                        actualCost = actualBillableDays * 8 * rate;
                        expectedCost = totalBusinessDays * 8 * rate;
                    }
                    monthTotalCost += actualCost;
                    monthExpectedCost += expectedCost;
                }
            }

            monthlyData.push({
                monthIndex: month,
                monthName: new Date(targetYear, month).toLocaleString('default', { month: 'short' }),
                cost: monthTotalCost,
                expectedCost: monthExpectedCost
            });
        }

        res.json({
            year: targetYear,
            projectId: targetProjectId,
            data: monthlyData
        });

    } catch (error: any) {
        console.error('[Billing] Error generating annual report:', error);
        res.status(500).json({ message: 'Error generating annual report', error: error.message || error });
    }
};

// Get stats for the logged-in resource
export const getResourceStats = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user?.id;
        const { month, year } = req.query;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const m = month ? parseInt(month as string) : new Date().getMonth();
        const y = year ? parseInt(year as string) : new Date().getFullYear();

        // 1. Month Stats
        const monthStats = await calculateBillableDays(userId, m, y);

        // 2. Annual Stats
        // Calculate total business days for the year (UTC)
        let annualBusinessDays = 0;
        const yearBusinessDaysSet = new Set<string>();

        for (let i = 0; i < 12; i++) {
            const days = new Date(Date.UTC(y, i + 1, 0)).getUTCDate();
            for (let d = 1; d <= days; d++) {
                const date = new Date(Date.UTC(y, i, d));
                const day = date.getUTCDay();
                if (day !== 0 && day !== 6) {
                    annualBusinessDays++;
                    yearBusinessDaysSet.add(date.toISOString().split('T')[0]);
                }
            }
        }

        const startOfYear = new Date(Date.UTC(y, 0, 1));
        const endOfYear = new Date(Date.UTC(y, 11, 31, 23, 59, 59));

        const annualLeaves = await prisma.leave.findMany({
            where: {
                userId,
                date: {
                    gte: startOfYear,
                    lte: endOfYear
                }
            }
        });

        let annualLeavesCount = 0;
        for (const l of annualLeaves) {
            const dateStr = new Date(l.date).toISOString().split('T')[0];
            if (yearBusinessDaysSet.has(dateStr)) {
                annualLeavesCount += l.isHalfDay ? 0.5 : 1;
            }
        }

        res.json({
            month: m,
            year: y,
            monthStats: {
                workingDays: monthStats.actualBillableDays, // This is working days - leaves
                leavesTaken: monthStats.leaveDaysCount
            },
            annualStats: {
                workingDays: Math.max(0, annualBusinessDays - annualLeavesCount),
                leavesTaken: annualLeavesCount
            }
        });

    } catch (error: any) {
        console.error('Error fetching resource stats:', error);
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
};
