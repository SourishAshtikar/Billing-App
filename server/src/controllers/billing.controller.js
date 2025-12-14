const db = require('../models');
const Project = db.Project;
const User = db.User;
const Leave = db.Leave;
const MonthlyBill = db.MonthlyBill;
const { Op } = require('sequelize');

exports.generateBill = async (req, res) => {
    try {
        const { projectId, month, year } = req.body; // Month is 1-12

        const project = await Project.findByPk(projectId, {
            include: [{
                model: User,
                through: { attributes: [] }
            }]
        });

        if (!project) {
            return res.status(404).send({ message: "Project not found" });
        }

        let totalBillAmount = 0;
        const billDetails = [];

        // Calculate start and end date of the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const totalDaysInMonth = endDate.getDate();

        for (const user of project.users) {
            // Calculate weekends (Sat/Sun)
            let weekends = 0;
            for (let d = 1; d <= totalDaysInMonth; d++) {
                const currentDay = new Date(year, month - 1, d);
                const dayOfWeek = currentDay.getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    weekends++;
                }
            }

            // Get leaves for this user in this month
            const leaves = await Leave.count({
                where: {
                    user_id: user.id,
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            const workingDays = totalDaysInMonth - weekends - leaves;
            // Basic Logic: 8 hours per day
            const userBill = workingDays * 8 * parseFloat(user.hourly_rate);

            totalBillAmount += userBill;
            billDetails.push({
                userId: user.id,
                userName: user.name,
                totalDays: totalDaysInMonth,
                weekends,
                leaves,
                workingDays,
                hourlyRate: user.hourly_rate,
                amount: userBill
            });
        }

        // Save Bill
        const bill = await MonthlyBill.create({
            project_id: projectId,
            month,
            year,
            total_amount: totalBillAmount,
            details: billDetails
        });

        res.status(201).send(bill);

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.getProjectBills = async (req, res) => {
    try {
        const { projectId } = req.params;
        const bills = await MonthlyBill.findAll({
            where: { project_id: projectId },
            order: [['year', 'DESC'], ['month', 'DESC']]
        });
        res.status(200).send(bills);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};
