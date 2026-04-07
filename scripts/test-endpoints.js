const fetch = require('node-fetch');

const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = 'ZaW1qwTEkuq7Ub1cBUuyMiK5bNSu3nnMQ9lh7klElc2clSRV8t';

async function testAuth() {
    const methods = [
        { name: 'POST /instance/init (body: name)', url: `${UAZAPI_URL}/instance/init`, method: 'POST', headers: { 'admintoken': UAZAPI_TOKEN }, body: JSON.stringify({ name: 'test-instance-slug' }) },
        { name: 'POST /instance/init (body: instanceName)', url: `${UAZAPI_URL}/instance/init`, method: 'POST', headers: { 'admintoken': UAZAPI_TOKEN }, body: JSON.stringify({ instanceName: 'test-instance-slug' }) },
        { name: 'POST /instance/init (query: instanceName)', url: `${UAZAPI_URL}/instance/init?instanceName=test-instance-slug`, method: 'POST', headers: { 'admintoken': UAZAPI_TOKEN } },
        { name: 'POST /instance/init (query: name)', url: `${UAZAPI_URL}/instance/init?name=test-instance-slug`, method: 'POST', headers: { 'admintoken': UAZAPI_TOKEN } },
    ];

    for (const method of methods) {
        console.log(`Testing method: ${method.name}...`);
        try {
            const url = method.url;
            const res = await fetch(url, { 
                method: method.method || 'GET',
                headers: { ...method.headers, 'Content-Type': 'application/json' },
                body: method.body
            });
            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(`Response: ${text}`);
            if (res.status === 200 || res.status === 201) {
                console.log('SUCCESS! Method found:', method.name);
            }
        } catch (e) {
            console.error(`Error ${method.name}:`, e.message);
        }
        console.log('---');
    }
}

testAuth();
