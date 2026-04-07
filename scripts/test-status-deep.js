const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '62b6cfe8-2b96-461d-b863-41e4a6581beb';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function testStatus() {
    console.log('Testing /instance/status...');
    try {
        const res = await fetch(`${UAZAPI_URL}/instance/status`, { headers });
        const json = await res.json();
        console.log('Status Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testStatus();
