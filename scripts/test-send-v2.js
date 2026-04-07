const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '62b6cfe8-2b96-461d-b863-41e4a6581beb';
const INSTANCE_NAME = 'U8aEts';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function testSendV2() {
    console.log('Testing /message/sendText (POST)...');
    try {
        const res = await fetch(`${UAZAPI_URL}/message/sendText?instanceName=${INSTANCE_NAME}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                number: '554888670105',
                text: 'Teste oficial Uazapi V2',
            }),
        });
        console.log('Status:', res.status);
        const json = await res.json();
        console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testSendV2();
