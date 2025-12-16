const http = require('http');

const data = JSON.stringify({
    empId: 'EMP999',
    name: 'Test Resource',
    email: 'testresource@example.com',
    joiningDate: '2025-01-15'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        // Add a fake JWT cookie to bypass auth
        'Cookie': 'jwt=fake_token_for_testing'
    }
};

console.log('Sending POST request to /api/resources...');
console.log('Data:', data);

const req = http.request(options, (res) => {
    console.log(`\nStatus: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Body:', body);
        try {
            const parsed = JSON.parse(body);
            console.log('\nParsed Response:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('(Not JSON)');
        }
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
