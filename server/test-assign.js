
const projectId = 'a7496e11-335c-44b9-a29c-5ac05482cd27';
const userId = '5f18d59d-e474-4830-8bca-88c9c1345411';

async function main() {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'admin' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const cookie = loginRes.headers.get('set-cookie');
    console.log('Logged in. Cookie:', cookie);

    console.log('Assigning resource...');
    const assignRes = await fetch('http://localhost:5000/api/resources/assign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: JSON.stringify({
            projectId,
            userId,
            rate: 100,
            assignedDays: 5,
            startDate: '2024-12-16'
        })
    });

    const data = await assignRes.json();
    console.log('Assignment response:', JSON.stringify(data, null, 2));
}

main();
