const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let adminToken = '';
let employeeToken = '';
let userId = '';
let projectId = '';

async function runTest() {
    try {
        console.log('--- Starting E2E Test ---');

        // 1. Login Admin
        console.log('1. Logging in Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/signin`, {
            email: 'admin@test.com',
            password: 'admin123'
        });
        adminToken = adminLogin.data.accessToken;
        console.log('   Admin Logged in. Token received.');

        // 2. Create Employee
        console.log('2. Creating Employee "John Doe"...');
        // Note: In a real app we might need a signup flow or admin create flow. 
        // Using signup endpoint for simplicity as per implementation.
        const empEmail = `john${Date.now()}@test.com`;
        await axios.post(`${API_URL}/auth/signup`, {
            name: 'John Doe',
            email: empEmail,
            password: 'password123',
            role: 'employee',
            hourly_rate: 20
        });
        console.log(`   Employee created: ${empEmail}`);

        // 3. Login Employee to get ID
        console.log('3. Logging in Employee...');
        const empLogin = await axios.post(`${API_URL}/auth/signin`, {
            email: empEmail,
            password: 'password123'
        });
        employeeToken = empLogin.data.accessToken;
        userId = empLogin.data.id;
        console.log(`   Employee Logged in. ID: ${userId}`);

        // 4. Create Project (as Admin)
        console.log('4. Creating Project...');
        const projCode = `P${Date.now()}`;
        const projectRes = await axios.post(`${API_URL}/admin/projects`, {
            code: projCode,
            name: 'Test Project'
        }, { headers: { 'x-access-token': adminToken } });
        projectId = projectRes.data.id;
        console.log(`   Project Created. ID: ${projectId}`);

        // 5. Assign Employee to Project (as Admin)
        console.log('5. Assigning Employee to Project...');
        await axios.post(`${API_URL}/admin/assign`, {
            projectId: projectId,
            userId: userId
        }, { headers: { 'x-access-token': adminToken } });
        console.log('   Employee Assigned.');

        // 6. Mark Leave (as Employee)
        console.log('6. Marking Leave...');
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];
        await axios.post(`${API_URL}/employee/leaves`, {
            date: dateString,
            reason: 'Sick Leave'
        }, { headers: { 'x-access-token': employeeToken } });
        console.log(`   Leave marked for ${dateString}.`);

        // 7. Generate Bill (as Admin)
        console.log('7. Generating Bill...');
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const billRes = await axios.post(`${API_URL}/billing/generate`, {
            projectId: projectId,
            month: currentMonth,
            year: currentYear
        }, { headers: { 'x-access-token': adminToken } });

        console.log('--- Billing Result ---');
        console.log(`Total Amount: $${billRes.data.total_amount}`);
        const details = billRes.data.details[0];
        console.log(`User: ${details.userName}`);
        console.log(`Working Days: ${details.workingDays}`);
        console.log(`Leaves: ${details.leaves}`);

        if (details.leaves === 1) {
            console.log('SUCCESS: Leave was deducted correctly.');
        } else {
            console.error('FAILURE: Leave count incorrect.');
        }

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

runTest();
