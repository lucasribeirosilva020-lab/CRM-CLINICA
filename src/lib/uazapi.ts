// Serviço de integração com a Uazapi
const UAZAPI_URL = process.env.UAZAPI_URL || '';
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_TOKEN || ''; // O token no .env agora é o ADMIN token

const adminHeaders = {
    'admintoken': UAZAPI_ADMIN_TOKEN,
    'Content-Type': 'application/json',
};

/**
 * Utilitário para gerar headers de uma instância específica
 */
function getInstanceHeaders(instanceToken?: string) {
    return {
        'token': instanceToken || UAZAPI_ADMIN_TOKEN,
        'Content-Type': 'application/json',
    };
}

/**
 * Utilitário para garantir que o nome da instância seja seguro para a API
 */
export function sanitizarNomeInstancia(nome: string): string {
    return nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Lista todas as instâncias (Requer Admin Token)
 */
export async function listarInstancias() {
    try {
        const res = await fetch(`${UAZAPI_URL}/instance/list`, { headers: adminHeaders });
        if (!res.ok) {
            const text = await res.text();
            console.error(`[UAZAPI] Erro ao listar instâncias (${res.status}):`, text);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error('[UAZAPI] Erro ao listar instâncias:', error);
        return [];
    }
}

/**
 * Busca uma instância específica pelo nome
 */
export async function buscarInstancia(instanceName: string) {
    const instancias = await listarInstancias();
    if (Array.isArray(instancias)) {
        return instancias.find((i: any) => i.name === instanceName || i.instanceName === instanceName);
    }
    return null;
}

/**
 * Cria uma nova instância na Uazapi (Requer Admin Token)
 * Retorno inclui o "token" específico desta instância
 */
export async function criarInstancia(instanceName: string) {
    const res = await fetch(`${UAZAPI_URL}/instance/init`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
            name: instanceName,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        console.error(`[UAZAPI] Erro ao criar instância (${res.status}):`, data);
        return { error: data.error || `Erro ${res.status}` };
    }

    return data;
}

/**
 * Define o Webhook para a instância
 */
export async function definirWebhook(instanceName: string, webhookUrl: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/instance/set-webhook`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({
            instanceName,
            webhookUrl,
            events: [
                "messages-upsert",
                "connection-update",
                "chats-update",
                "contacts-update"
            ]
        }),
    });
    return res.json();
}

/**
 * Inicia o processo de conexão da instância (Requer na V2 para gerar QR Code)
 */
export async function conectarInstancia(instanceName: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/instance/connect`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({ instanceName }),
    });
    return res.json();
}

/**
 * Retorna o QR Code para conexão
 */
export async function obterQrCode(instanceName: string, instanceToken?: string) {
    console.log(`[UAZAPI] Solicitando QR Code para: ${instanceName}`);
    
    // Na V2, as vezes precisamos dar o connect antes
    await conectarInstancia(instanceName, instanceToken);

    const res = await fetch(`${UAZAPI_URL}/instance/qr?instanceName=${instanceName}`, {
        headers: getInstanceHeaders(instanceToken),
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.error(`[UAZAPI] Erro QR Code (${res.status}):`, text);
        return { error: `Erro ${res.status}: ${text}`, status: res.status };
    }

    return res.json();
}

/**
 * Verifica o status de conexão da instância
 */
export async function statusInstancia(instanceName: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/instance/status?instanceName=${instanceName}`, { 
        headers: getInstanceHeaders(instanceToken) 
    });

    if (!res.ok) {
        const text = await res.text();
        // Se for 401 ou 404, sinaliza erro para que a instância seja recriada
        return { error: `Erro ${res.status}: ${text}`, status: res.status };
    }

    return res.json();
}

/**
 * Deleta uma instância (Requer Admin Token)
 */
export async function deletarInstancia(instanceName: string) {
    const res = await fetch(`${UAZAPI_URL}/instance/delete?instanceName=${instanceName}`, { 
        method: 'DELETE',
        headers: adminHeaders
    });
    return res.json();
}

/**
 * Envia uma mensagem de texto via Uazapi
 */
export async function enviarMensagem(instanceName: string, numero: string, texto: string, instanceToken?: string) {
    const numeroFormatado = numero.replace(/\D/g, '');
    
    const res = await fetch(`${UAZAPI_URL}/send/text`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({
            number: numeroFormatado,
            text: texto,
        }),
    });
    return res.json();
}

/**
 * Busca a lista de contatos (Sync) - Versão V2
 */
export async function listarContatos(instanceName: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/contacts/list?instanceName=${instanceName}`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({ page: 1, pageSize: 100 })
    });
    return res.json();
}

/**
 * Busca a lista de conversas recentes (Sync) - Versão V2
 */
export async function listarConversas(instanceName: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/chat/find?instanceName=${instanceName}`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({ 
            operator: "AND",
            sort: "-wa_lastMsgTimestamp",
            limit: 50
        })
    });
    return res.json();
}

/**
 * Busca mensagens de uma conversa específica
 */
export async function buscarMensagens(instanceName: string, remoteJid: string, instanceToken?: string) {
    const res = await fetch(`${UAZAPI_URL}/chat/messages?instanceName=${instanceName}&remoteJid=${remoteJid}&limit=20`, {
        headers: getInstanceHeaders(instanceToken),
    });
    return res.json();
}

/**
 * Envia mídia (imagem, áudio, vídeo, documento) via Uazapi
 */
export async function enviarMedia(
    instanceName: string, 
    numero: string, 
    url: string, 
    tipo: 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT', 
    legenda?: string,
    instanceToken?: string
) {
    const numeroFormatado = numero.replace(/\D/g, '');
    const endpointType = tipo === 'IMAGE' ? 'image' : 
                         tipo === 'AUDIO' ? 'audio' : 
                         tipo === 'VIDEO' ? 'video' : 'document';
    
    // A Uazapi Free unifica os envios de mídia na rota /send/media
    const res = await fetch(`${UAZAPI_URL}/send/media`, {
        method: 'POST',
        headers: getInstanceHeaders(instanceToken),
        body: JSON.stringify({
            instanceName,
            number: numeroFormatado,
            type: endpointType,
            file: url, // a API gratuita da Uazapi espera estritamente a chave "file" para a URL
            text: legenda || "", // Evita erro de 'missing text' acidental
            ...(tipo === 'AUDIO' && { ptt: true })
        }),
    });
    return res.json();
}

