const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Leave = sequelize.define('leaves', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING
    }
});

module.exports = Leave;
