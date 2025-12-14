const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const MonthlyBill = sequelize.define('monthly_bills', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    month: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    details: {
        type: DataTypes.JSON, // Stores calculation details snapshot
        allowNull: true
    }
});

module.exports = MonthlyBill;
