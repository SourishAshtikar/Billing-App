const db = require('./src/models');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        await db.sequelize.sync();

        const existingAdmin = await db.User.findOne({ where: { email: 'admin@test.com' } });
        if (existingAdmin) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        await db.User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: bcrypt.hashSync('admin123', 8),
            role: 'admin',
            hourly_rate: 0
        });

        console.log('Admin user created successfully.');
        console.log('Email: admin@test.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed admin:', error);
        process.exit(1);
    }
};

seedAdmin();
