import { Request, Response } from 'express';
import { parse } from 'csv-parse';
import fs from 'fs';
import prisma from '../db';

interface RtoCsvRow {
    'Employee ID': string;
    'Employee Name': string;
    'Work Location': string;
    'Project Code': string;
    'Project name': string;
    'RM SAP ID': string;
    'RM name': string;
}

// Upload User Data CSV
export const uploadRtoCsv = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;

    const stream = fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

    stream.on('data', (row: any) => {
        results.push(row);
    });

    stream.on('error', (error) => {
        console.error('CSV Parse Error:', error);
        res.status(500).json({ message: 'Error parsing CSV file' });
    });

    stream.on('end', async () => {
        try {
            // Optional: Clear existing data before upload if required? 
            // User didn't specify, but usually "upload based on Employee ID" implies adding/updating.
            // For now, I'll just append. If duplicates need handling, we can add logic later.
            // Actually, let's wrap this in a transaction if we were replacing, but for now simple insert.

            for (const [index, row] of results.entries()) {
                const {
                    'Employee ID': empId,
                    'Employee Name': empName,
                    'Work Location': workLocation,
                    'Project Code': projectCode,
                    'Project name': projectName,
                    'RM SAP ID': rmSapId,
                    'RM name': rmName
                } = row;

                // Basic validation
                if (!empId || !empName) {
                    errors.push({ row: index + 1, message: 'Missing required fields (Employee ID, Employee Name)' });
                    continue;
                }

                try {
                    await prisma.rtoRecord.create({
                        data: {
                            empId,
                            empName,
                            workLocation,
                            projectCode,
                            projectName,
                            rmSapId,
                            rmName
                        }
                    });
                    successCount++;
                } catch (dbError: any) {
                    errors.push({ row: index + 1, message: dbError.message || 'Database error' });
                }
            }

            // Cleanup uploaded file
            fs.unlinkSync(req.file!.path);

            res.json({
                message: 'RTO data import completed',
                summary: {
                    total: results.length,
                    success: successCount,
                    failed: errors.length,
                    errors: errors
                }
            });

        } catch (error) {
            console.error('Error processing RTO upload:', error);
            // Ensure file is deleted even on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: 'Error processing upload' });
        }
    });
};

export const uploadRtoAttendanceCsv = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;

    const stream = fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

    stream.on('data', (row: any) => {
        results.push(row);
    });

    stream.on('error', (error) => {
        console.error('CSV Parse Error:', error);
        res.status(500).json({ message: 'Error parsing CSV file' });
    });

    stream.on('end', async () => {
        try {
            console.log('Processing attendance upload...');
            if (results.length > 0) {
                console.log('First row keys:', Object.keys(results[0]));
                console.log('First row data:', results[0]);
            }

            for (const [index, row] of results.entries()) {
                // Try multiple variations of the key
                // For Attendance: SN, SAP Code. For User Data: Employee ID
                const empId = row['SAP Code'] || row['SN'] || row['sap code'] || row['sn'] || row['\uFEFFSN'] || row['Employee ID'] || row['PERNR'];

                if (!empId) {
                    // Only log if really valid data row (e.g. valid length)
                    if (Object.keys(row).length > 2) {
                        console.log(`Row ${index + 1} missing ID. Available keys:`, Object.keys(row));
                        errors.push({ row: index + 1, message: 'Missing Employee ID (SAP Code, SN, or Employee ID)' });
                    }
                    continue;
                }

                let dateColumnsFound = false;

                for (const key of Object.keys(row)) {
                    // Match date keys like "Wed, 14 Jan 2026" OR "2026-01-14"
                    // Relaxed regex: starts with 3 letters, number, 3 letters, 4 digit year
                    if (key.match(/^[A-Za-z]{3},? \d{1,2} [A-Za-z]{3} \d{4}$/) || key.match(/^\d{4}-\d{2}-\d{2}$/) || key.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
                        dateColumnsFound = true;
                        const dateStr = key;
                        const value = row[key];

                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) continue;

                        let status = 'Absent';
                        let duration = null;

                        if (!value) {
                            status = 'Absent';
                        } else if (value.match(/^\d{1,2}:\d{2}$/)) {
                            status = 'Present';
                            const [hours, minutes] = value.split(':').map(Number);
                            duration = hours + (minutes / 60);
                        } else if (value.toLowerCase().includes('leave')) {
                            status = 'Leave';
                        } else if (value.toLowerCase().includes('so')) {
                            status = 'WeeklyOff';
                        } else if (value.toLowerCase().includes('holiday')) {
                            status = 'Holiday';
                        } else {
                            status = value;
                        }

                        try {
                            await prisma.rtoAttendance.upsert({
                                where: {
                                    empId_date: {
                                        empId: empId.toString(),
                                        date: date
                                    }
                                },
                                update: { status, duration },
                                create: {
                                    empId: empId.toString(),
                                    date: date,
                                    status,
                                    duration
                                }
                            });
                        } catch (err: any) {
                            // Silent fail
                        }
                    }
                }

                if (!dateColumnsFound) {
                    // This row had no date columns. If whole file is like this, likely wrong file format.
                    // But we iterate row by row. 
                } else {
                    successCount++;
                }
            }

            // Check if any attendance data was actually processed
            if (successCount === 0 && results.length > 0) {
                // Likely wrong file format uploaded
                return res.status(400).json({
                    message: 'No attendance data found. Please ensure the CSV has date columns (e.g., "Wed, 14 Jan 2026" or "YYYY-MM-DD").',
                    summary: { totalRows: results.length, processed: 0, errors: [] }
                });
            }

            fs.unlinkSync(req.file!.path);

            res.json({
                message: 'Attendance data import completed',
                summary: {
                    totalRows: results.length,
                    processed: successCount,
                    errors: errors
                }
            });

        } catch (error) {
            console.error('Error processing Attendance upload:', error);
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ message: 'Error processing upload' });
        }
    });
};

export const getRtoAnalytics = async (req: Request, res: Response) => {
    try {
        const { month, year, location } = req.query;

        const now = new Date();
        const targetMonth = month ? parseInt(month as string) : now.getMonth();
        const targetYear = year ? parseInt(year as string) : now.getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0);

        const attendance = await prisma.rtoAttendance.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const rtoRecords = await prisma.rtoRecord.findMany();

        const empStats: any = {};

        rtoRecords.forEach(record => {
            if (location && record.workLocation !== location && location !== 'All') return;

            empStats[record.empId] = {
                empId: record.empId,
                name: record.empName,
                location: record.workLocation,
                project: record.projectName,
                daysPresent: 0,
                compliant: false,
                weeklyCompliance: []
            };
        });

        attendance.forEach(record => {
            if (!empStats[record.empId]) {
                // Optionally include employees not in RtoRecord if needed, currently skipping based on logic
                return;
            }

            if (record.status === 'Present') {
                empStats[record.empId].daysPresent++;
            }
        });

        // Weekly Logic: 4 Weeks (1-7, 8-14, 15-21, 22-End)
        Object.values(empStats).forEach((emp: any) => {
            const empAttendance = attendance.filter(a => a.empId === emp.empId && a.status === 'Present');

            const weeks = [
                { start: 1, end: 7 },
                { start: 8, end: 14 },
                { start: 15, end: 21 },
                { start: 22, end: 31 }
            ];

            emp.weeklyCompliance = weeks.map((week, idx) => {
                const count = empAttendance.filter(a => {
                    const d = a.date.getDate();
                    return d >= week.start && d <= week.end;
                }).length;
                return {
                    week: idx + 1,
                    present: count,
                    compliant: count >= 3
                };
            });

            const monthlyCompliant = emp.daysPresent >= 12;
            const weeklyCompliant = emp.weeklyCompliance.every((w: any) => w.compliant);

            // Rule: "If any of above is not met, resource will be non compliant"
            // So MUST meet BOTH monthly >= 12 AND all weeks >= 3
            emp.compliant = monthlyCompliant && weeklyCompliant;
        });

        res.json(Object.values(empStats));

    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Error fetching analytics' });
    }
};
