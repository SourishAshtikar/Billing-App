const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to default 'postgres' db
    password: process.env.DB_PASSWORD,
    port: 5432,
});

async function createDatabase() {
    try {
        await client.connect();
        await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
        console.log(`Database ${process.env.DB_NAME} created successfully.`);
    } catch (err) {
        if (err.code === '42P04') {
            console.log(`Database ${process.env.DB_NAME} already exists.`);
        } else {
            console.error('Error creating database:', err);
        }
    } finally {
        await client.end();
    }
}

createDatabase();
