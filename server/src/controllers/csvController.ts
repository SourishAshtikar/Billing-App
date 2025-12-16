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
