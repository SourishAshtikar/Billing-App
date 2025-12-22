import { Request, Response } from 'express';
import { parse } from 'csv-parse';
import fs from 'fs';

import bcrypt from 'bcryptjs';

import prisma from '../db';

export const bulkImportResources = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;

    const stream = fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

    stream.on('data', async (row) => {
        // Pause stream to process async row (csv-parse handles buffering but simple way here)
        // Actually csv-parse stream is sync unless we handle backpressure, but let's collect all data first or map.
        // For simplicity with async/await database calls, let's collect them.
        results.push(row);
    });

    stream.on('error', (error) => {
        console.error('CSV Parse Error:', error);
        res.status(500).json({ message: 'Error parsing CSV file' });
    });

    stream.on('end', async () => {
        // Process each row
        // Expected columns: empId, name, email, joiningDate

        const hashedPassword = await bcrypt.hash('welcome123', 10);

        for (const [index, row] of results.entries()) {
            const { empId, name, email, joiningDate } = row;

            if (!empId || !name || !email || !joiningDate) {
                errors.push({ row: index + 1, message: 'Missing required fields' });
                continue;
            }

            try {
                // Check for duplicates
                const existing = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email },
                            { empId }
                        ]
                    }
                });

                if (existing) {
                    errors.push({ row: index + 1, message: `User already exists: ${email} or ${empId}` });
                    continue;
                }

                await prisma.user.create({
                    data: {
                        empId,
                        name,
                        email,
                        joiningDate: new Date(joiningDate),
                        password: hashedPassword,
                        role: 'RESOURCE'
                    }
                });
                successCount++;
            } catch (error: any) {
                errors.push({ row: index + 1, message: error.message || 'Database error' });
            }
        }

        // Cleanup uploaded file
        fs.unlinkSync(req.file!.path);

        res.json({
            message: 'Bulk import completed',
            summary: {
                total: results.length,
                success: successCount,
                failed: errors.length,
                errors: errors
            }
        });
    });
};

export const bulkImportLeaves = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;

    const stream = fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true }));

    stream.on('data', (row) => {
        results.push(row);
    });

    stream.on('error', (error) => {
        console.error('CSV Parse Error:', error);
        res.status(500).json({ message: 'Error parsing CSV file' });
    });

    stream.on('end', async () => {
        // Expected columns: empId, date, reason, isHalfDay
        for (const [index, row] of results.entries()) {
            const { empId, date, reason, isHalfDay } = row;

            if (!empId || !date) {
                errors.push({ row: index + 1, message: 'Missing required fields: empId, date' });
                continue;
            }

            try {
                // Find user by empId
                const user = await prisma.user.findUnique({
                    where: { empId }
                });

                if (!user) {
                    errors.push({ row: index + 1, message: `User not found: ${empId}` });
                    continue;
                }

                const leaveDate = new Date(date);
                if (isNaN(leaveDate.getTime())) {
                    errors.push({ row: index + 1, message: `Invalid date format: ${date}` });
                    continue;
                }

                // Check for existing leave
                const existingLeave = await prisma.leave.findUnique({
                    where: {
                        userId_date: {
                            userId: user.id,
                            date: leaveDate
                        }
                    }
                });

                if (existingLeave) {
                    // Update existing leave ?? Or skip?
                    // Let's update it for now or skip if exactly same.
                    // Implementation plan said: "Create Leave entries".
                    // Let's overwrite/update to be safe for corrections.
                    await prisma.leave.update({
                        where: { id: existingLeave.id },
                        data: {
                            reason: reason || existingLeave.reason,
                            isHalfDay: isHalfDay === 'true' || isHalfDay === true
                        }
                    });
                    successCount++;
                    // Technically an update, but counting as success.
                } else {
                    await prisma.leave.create({
                        data: {
                            userId: user.id,
                            date: leaveDate,
                            reason: reason || 'Bulk Import',
                            isHalfDay: isHalfDay === 'true' || isHalfDay === true
                        }
                    });
                    successCount++;
                }

            } catch (error: any) {
                errors.push({ row: index + 1, message: error.message || 'Database error' });
            }
        }

        // Cleanup
        fs.unlinkSync(req.file!.path);

        res.json({
            message: 'Bulk leave import completed',
            summary: {
                total: results.length,
                success: successCount,
                failed: errors.length,
                errors: errors
            }
        });
    });
};
