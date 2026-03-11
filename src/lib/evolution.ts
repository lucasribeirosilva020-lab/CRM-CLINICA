// Serviço de integração com a Evolution API
const EVOLUTION_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || '';

const headers = {
    'apikey': EVOLUTION_KEY,
    'Content-Type': 'application/json',
};

/**
 * Cria uma nova instância do WhatsApp na Evolution API
 */
export async function criarInstancia(instanceName: string, webhookUrl: string) {
    const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            instanceName,
            qrcode: true,
            webhook: {
                enabled: true,
                url: webhookUrl,
                events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE']
            }
        }),
    });
    return res.json();
}

/**
 * Conecta a instância e retorna o QR Code
 */
export async function conectarInstancia(instanceName: string) {
    const res = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
        headers,
    });
    return res.json();
}

/**
 * Verifica o status de conexão da instância
 */
export async function statusInstancia(instanceName: string) {
    const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
        headers,
    });
    return res.json();
}

/**
 * Deleta uma instância
 */
export async function deletarInstancia(instanceName: string) {
    const res = await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers,
    });
    return res.json();
}

/**
 * Envia uma mensagem de texto
 */
export async function enviarMensagem(instanceName: string, numero: string, texto: string) {
    // Normaliza o número (remove +, espaços, etc.)
    const numeroFormatado = numero.replace(/\D/g, '');

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            number: numeroFormatado,
            text: texto,
        }),
    });
    return res.json();
}

/**
 * Lista todas as instâncias
 */
export async function listarInstancias() {
    const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, {
        headers,
    });
    return res.json();
}
