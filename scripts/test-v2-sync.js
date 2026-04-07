const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '62b6cfe8-2b96-461d-b863-41e4a6581beb';
const INSTANCE_NAME = 'U8aEts';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function testV2Sync() {
    console.log('Testing /contacts/list (POST)...');
    try {
        const res = await fetch(`${UAZAPI_URL}/contacts/list?instanceName=${INSTANCE_NAME}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ page: 1, pageSize: 20 })
        });
        console.log('Contacts Status:', res.status);
        const json = await res.json();
        console.log('Contacts Count:', Array.isArray(json) ? json.length : (json.data ? json.data.length : 'Object'));
    } catch (e) {
        console.error('Contacts Error:', e.message);
    }

    console.log('\nTesting /chat/find (POST)...');
    try {
        const res = await fetch(`${UAZAPI_URL}/chat/find?instanceName=${INSTANCE_NAME}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ limit: 20, sort: "-wa_lastMsgTimestamp" })
        });
        console.log('Chats Status:', res.status);
        const json = await res.json();
        console.log('Chats Count:', Array.isArray(json) ? json.length : (json.data ? json.data.length : 'Object'));
        if (json.data && json.data.length > 0) {
            console.log('First chat lastMsg:', json.data[0].wa_lastMsgText);
        }
    } catch (e) {
        console.error('Chats Error:', e.message);
    }
}

testV2Sync();
