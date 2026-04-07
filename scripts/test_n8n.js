const fetch = require('node-fetch');

const webhookUrl = 'https://servidor-n8n.kmtsni.easypanel.host/webhook-test/sofia';
const payload = {
    Numero: '5511999999999',
    from: '5511999999999',
    remoteJid: '5511999999999@s.whatsapp.net',
    Mensagem: 'Teste de Envio CRM',
    fromMe: true,
    data: {
        remoteJid: '5511999999999@s.whatsapp.net',
        from: '5511999999999',
        messages: [{
            key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: true },
            message: { conversation: 'Teste de Envio CRM' }
        }]
    }
};

async function test() {
    console.log('Enviando para:', webhookUrl);
    try {
        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Resposta:', text);
    } catch (err) {
        console.error('Erro:', err.message);
    }
}

test();
