const http = require('http');

const data = JSON.stringify({
    empId: 'TEST001',
    name: 'Test User',
    email: 'test@test.com',
    joiningDate: '2025-01-01'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
