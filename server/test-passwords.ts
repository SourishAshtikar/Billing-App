import { Client } from 'pg';

const passwords = ['postgres', 'billingappdb', 'admin', 'password', 'root', ''];
const user = 'postgres';
const db = 'billing_db';
const host = 'localhost';
const port = 5432;

async function testPasswords() {
    console.log('Testing passwords for user:', user);

    for (const pass of passwords) {
        const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${db}`;
        const client = new Client({ connectionString });
        process.stdout.write(`Testing password: "${pass}" ... `);

        try {
            await client.connect();
            console.log('SUCCESS!');
            await client.end();
            process.exit(0);
        } catch (err: any) {
            console.log('FAILED (' + err.code + ')');
            // 28P01 is auth failed
        }
    }
    console.log('All passwords failed.');
    process.exit(1);
}

testPasswords();
