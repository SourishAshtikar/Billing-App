const Sequelize = require('sequelize');
const sequelize = require('../config/db.config');

const User = require('./user.model');
const Project = require('./project.model');
const Leave = require('./leave.model');
const MonthlyBill = require('./monthly_bill.model');

// Associations
User.hasMany(Leave, { foreignKey: 'user_id' });
Leave.belongsTo(User, { foreignKey: 'user_id' });

Project.belongsToMany(User, { through: 'project_assignments', foreignKey: 'project_id' });
User.belongsToMany(Project, { through: 'project_assignments', foreignKey: 'user_id' });

Project.hasMany(MonthlyBill, { foreignKey: 'project_id' });
MonthlyBill.belongsTo(Project, { foreignKey: 'project_id' });

const db = {
    Sequelize,
    sequelize,
    User,
    Project,
    Leave,
    MonthlyBill
};

module.exports = db;
