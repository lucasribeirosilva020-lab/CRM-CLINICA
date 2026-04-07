const UAZAPI_URL = 'https://free.uazapi.com';
const UAZAPI_TOKEN = 'ZaW1qwTEkuq7Ub1cBUuyMiK5bNSu3nnMQ9lh7klElc2clSRV8t';
const TEST_INSTANCE = 'juju';

async function debug() {
    console.log('--- 1. Testing Instance Creation ---');
    try {
        const createRes = await fetch(`${UAZAPI_URL}/instance/init`, {
            method: 'POST',
            headers: {
                'admintoken': UAZAPI_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: TEST_INSTANCE })
        });
        
        const createData = await createRes.json();
        console.log('Create Status:', createRes.status);
        console.log('Create Response:', JSON.stringify(createData, null, 2));

        const instanceToken = createData.token || createData.instance?.token;
        
        if (!instanceToken) {
            console.error('Failed to get instance token');
            return;
        }

        console.log('\n--- 2. Waiting 5 seconds for instance to settle ---');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('\n--- 3. Checking Instance Status ---');
        const statusRes = await fetch(`${UAZAPI_URL}/instance/status?instanceName=${TEST_INSTANCE}`, {
            headers: {
                'token': instanceToken,
                'Content-Type': 'application/json'
            }
        });
        const statusData = await statusRes.json();
        console.log('Status Status:', statusRes.status);
        console.log('Status Response:', JSON.stringify(statusData, null, 2));

        console.log('\n--- 4. Testing /instance/connect ---');
        const connectRes = await fetch(`${UAZAPI_URL}/instance/connect`, {
            method: 'POST',
            headers: {
                'token': instanceToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ instanceName: TEST_INSTANCE })
        });
        const connectData = await connectRes.json();
        console.log('Connect Status:', connectRes.status);
        console.log('Connect Response:', JSON.stringify(connectData, null, 2));

        console.log('\n--- 5. Testing QR Code Retrieval ---');
        const qrRes = await fetch(`${UAZAPI_URL}/instance/qr?instanceName=${TEST_INSTANCE}`, {
            headers: {
                'token': instanceToken,
                'Content-Type': 'application/json'
            }
        });

        const qrData = await qrRes.json();
        console.log('QR Status:', qrRes.status);
        if (qrRes.status === 200) {
            console.log('SUCCESS! QR Code found.');
            console.log('QR Data Length:', qrData.base64?.length || 'No base64');
        } else {
            console.log('QR Response:', JSON.stringify(qrData, null, 2));
        }

    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

debug();
