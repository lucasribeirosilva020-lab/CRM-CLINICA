const fetch = require('node-fetch');

async function testIncoming() {
    const url = 'http://localhost:3000/api/webhook/whatsapp';
    const payload = {
        event: 'message.received',
        clinicaId: 'cmmcadxx400088sce6f5vfe3j',
        data: {
            from: '5511999999999',
            pushName: 'João da Silva',
            text: 'Olá, esta é uma mensagem de teste vinda do n8n!'
        }
    };

    console.log('Enviando simulado do n8n para o CRM...');
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log('Resposta do CRM:', json);
}

testIncoming().catch(console.error);
