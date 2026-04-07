// Simula o que o controller de mensagens faz
const fetch = require('node-fetch');

async function testSending() {
    // Lead info (existing from previous test)
    const leadId = 'cmnagsjja0001holaewd252ei';
    const clinicaId = 'cmmcadxx400088sce6f5vfe3j';
    
    // Simula a URL do n8n que configuramos
    const n8nWebhookUrl = 'http://localhost:9999/webhook-test';
    
    console.log(`Testando envio para o n8n: ${n8nWebhookUrl}`);

    // Como no quero subir um server na porta 9999 agora, 
    // apenas vou rodar o script que chama a ROTA do CRM, 
    // mas a rota do CRM precisa de Auth.
    
    // Ento vou simular o FETCH que o CRM faria:
    try {
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'message.send',
                leadId,
                telefone: '5511999999999',
                mensagem: 'Teste de envio CRM -> n8n',
                tipo: 'TEXTO',
                clinicaId
            })
        });
        console.log('Fetch enviado (esperado erro se o porta 9999 estiver fechada, mas o log do CRM confirmaria a tentativa)');
    } catch (e) {
        console.log('Fetch tentado, mas falhou (esperado):', e.message);
    }
}

testSending();
