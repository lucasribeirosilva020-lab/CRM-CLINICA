const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '0a1d1711-39b2-482e-8995-e2b9cb4c1ad3';
const INSTANCE_NAME = 'teste';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function testSend() {
    console.log('Testing /message/text with instanceName...');
    try {
        const res = await fetch(`${UAZAPI_URL}/message/text`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                number: '554888670105', // Testing with the owner number
                text: 'Teste de conexão Uazapi Free',
            }),
        });
        const json = await res.json();
        console.log('Send Response:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testSend();
