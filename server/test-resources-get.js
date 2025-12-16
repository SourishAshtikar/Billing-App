const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/resources',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

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

req.end();
