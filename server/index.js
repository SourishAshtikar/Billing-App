const app = require('./src/app');
const db = require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Sync database and start server
db.sequelize.sync({ force: false }) // set force: true to drop tables on startup
    .then(() => {
        console.log('Database connected and synced.');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch(err => {
        console.error('Failed to sync database:', err);
    });
