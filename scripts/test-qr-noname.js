const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '62b6cfe8-2b96-461d-b863-41e4a6581beb';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function testQrNoName() {
    console.log(`Testing ${UAZAPI_URL}/instance/qr (No instanceName)...`);
    try {
        const res = await fetch(`${UAZAPI_URL}/instance/qr`, { headers });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text.slice(0, 100));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testQrNoName();
