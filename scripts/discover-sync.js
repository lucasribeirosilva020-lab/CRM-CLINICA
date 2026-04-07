const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = '62b6cfe8-2b96-461d-b863-41e4a6581beb';
const INSTANCE_NAME = 'U8aEts';

const headers = {
    'token': UAZAPI_TOKEN,
    'Content-Type': 'application/json',
};

async function discoverSync() {
    const endpoints = [
        `/contact/list`,
        `/chat/list-all`,
        `/instance/contacts`,
        `/instance/chats`,
        `/chat/get-chats`,
        `/v1/chat/list`,
        `/v1/contact/list`
    ];

    for (const ep of endpoints) {
        console.log(`Testing ${ep}...`);
        try {
            const res = await fetch(`${UAZAPI_URL}${ep}?instanceName=${INSTANCE_NAME}`, { headers });
            console.log(`Status: ${res.status}`);
            if (res.status === 200) {
                const json = await res.json();
                console.log(`Success! Count: ${Array.isArray(json) ? json.length : 'Object'}`);
                return;
            }
        } catch (e) {
            console.error(`Error:`, e.message);
        }
    }
}

discoverSync();
