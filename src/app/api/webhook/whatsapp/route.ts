import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import fs from 'fs';

/**
 * Webhook para receber eventos da Uazapi
 */
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.json();
        const logFile = 'WEBHOOK_DEBUG.log';
        const timestamp = new Date().toISOString();
        
        fs.appendFileSync(logFile, `\n--- [${timestamp}] NOVO WEBHOOK RECEBIDO ---\n`);
        fs.appendFileSync(logFile, `PAYLOAD: ${JSON.stringify(rawBody)}\n`);
        
        let body = rawBody;
        
        const event = body.event || body.type || body.evento;
        const instance = body.instance || body.instanceName || body.instancia;
        const data = body.data || body.payload || body;

        // --- IDENTIFICAÇÃO DA CLÍNICA ---
        let clinicaId = body.clinicaId || body.clínicaId || data?.clinicaId || body.idClinica;

        // Fallback 1: Pela URL do webhook (n8n)
        if (!clinicaId) {
            const possibleUrl = body.webhookUrl || data?.webhookUrl || body.webhook_url;
            if (possibleUrl) {
                const { data: configs } = await supabaseAdmin
                    .from('ConfiguracaoClinica')
                    .select('clinicaId')
                    .ilike('webhookN8nUrl', `%${possibleUrl}%`);
                
                clinicaId = configs?.[0]?.clinicaId;
                if (clinicaId) console.log(`[WEBHOOK] Clínica identificada via webhookUrl fallback: ${clinicaId}`);
            }
        }

        // Fallback 2: Pela instância/slug
        if (!clinicaId && instance) {
            const { data: clinica } = await supabaseAdmin
                .from('Clinica')
                .select('id')
                .eq('slug', instance)
                .single();
            clinicaId = clinica?.id;
        }

        if (!clinicaId) {
            fs.appendFileSync(logFile, `[ERRO] Clínica não identificada\n`);
            console.warn(`[WEBHOOK REJEITADO] Clínica não identificada. Payload: ${JSON.stringify(body).slice(0, 200)}...`);
            return NextResponse.json({ ok: true, error: 'Clínica não identificada' });
        }
        
        fs.appendFileSync(logFile, `CLINICA_ID: ${clinicaId}\n`);

        const date = new Date();
        const nowDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();

        // --- PROCESSAMENTO DA MENSAGEM ---
        
        // 1. Tenta extrair Numero e Mensagem (permissivo)
        let numeroRaw = body.Numero || body.numero || body.phone || body.telefone || body.whatsapp || data?.remoteJid || data?.from;
        let mensagemRaw = body.Mensagem || body.mensagem || body.text || body.conteudo || body.content || data?.text || data?.body;
        let nomeContato = body.Nome || body.nome || body.name || body.pushName || data?.pushName || data?.sender?.name || data?.senderName || body.senderName;
        let isFromMe = (body.fromMe === true);

        // Se a Mensagem for um JSON (comum no n8n)
        if (typeof mensagemRaw === 'string' && mensagemRaw.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(mensagemRaw);
                const deeper = parsed.body || parsed.message || parsed.payload || parsed.data || parsed;
                const msgObj = deeper.message || deeper;

                mensagemRaw = msgObj.content || msgObj.text || msgObj.body || msgObj.conversation || mensagemRaw;
                if (typeof mensagemRaw === 'object') mensagemRaw = mensagemRaw.text || mensagemRaw.content || JSON.stringify(mensagemRaw);
                
                if (msgObj.fromMe !== undefined) isFromMe = msgObj.fromMe;
                else if (deeper.fromMe !== undefined) isFromMe = deeper.fromMe;

                if (!numeroRaw) {
                    numeroRaw = deeper.wa_chatid || deeper.remoteJid || msgObj.chatid || msgObj.remoteJid || deeper.phone || msgObj.phone;
                }
                
                if (!nomeContato) {
                    nomeContato = msgObj.pushName || msgObj.senderName || deeper.pushName || deeper.senderName || deeper.nome || msgObj.nome;
                }
            } catch(e) { }
        }

        if (numeroRaw && mensagemRaw) {
            const telefone = String(numeroRaw).replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
            const mensagemTexto = String(mensagemRaw);
            
            let tipoMensagem = 'TEXTO';
            
            // Lógica de Parser para mídias vindas do n8n
            if (mensagemTexto.startsWith('[MEDIA_URL]|')) {
                const partes = mensagemTexto.split('|');
                if (partes.length >= 3) {
                    const t = partes[2].toLowerCase();
                    if (t.includes('image') || t.includes('imagem') || t.includes('foto') || t.includes('photo')) {
                        tipoMensagem = 'IMAGEM';
                    } else if (t.includes('audio') || t.includes('ptt') || t.includes('voice')) {
                        tipoMensagem = 'AUDIO';
                    } else if (t.includes('video')) {
                        tipoMensagem = 'VIDEO';
                    } else if (t.includes('document') || t.includes('pdf') || t.includes('arquivo') || t.includes('file')) {
                        tipoMensagem = 'DOCUMENTO';
                    }
                }
                fs.appendFileSync(logFile, `[PARSER N8N] Mídia detectada: ${tipoMensagem} do termo: ${partes[2]}\n`);
            }

            if (telefone && mensagemTexto && mensagemTexto !== 'undefined' && mensagemTexto !== '') {
                console.log(`[WEBHOOK] Salvando mensagem: ${telefone}. Tipo: ${tipoMensagem}. Texto: ${mensagemTexto.slice(0, 50)}...`);

                // Busca lead e conversa
                const { data: lead } = await supabaseAdmin
                    .from('Lead')
                    .select('id, conversa:Conversa(id, naoLidas, kanbanAtenStat, kanbanVendStat)')
                    .eq('clinicaId', clinicaId)
                    .eq('telefone', telefone)
                    .single();

                let leadId = lead?.id;
                let conversa = (lead?.conversa as any)?.[0];

                if (!leadId) {
                    const finalName = nomeContato || `Lead ${telefone}`;
                    const { data: novoLead } = await supabaseAdmin
                        .from('Lead')
                        .insert({ id: crypto.randomUUID(), clinicaId, nome: finalName, telefone, tags: '[]', createdAt: nowDate, updatedAt: nowDate })
                        .select()
                        .single();
                    leadId = novoLead?.id;
                }

                if (!conversa && leadId) {
                    const { data: novaConv } = await supabaseAdmin
                        .from('Conversa')
                        .insert({ id: crypto.randomUUID(), clinicaId, leadId, kanbanAtenStat: 'fila_espera', kanbanVendStat: 'contato_inicial', createdAt: nowDate, updatedAt: nowDate })
                        .select()
                        .single();
                    conversa = novaConv;
                }

                if (conversa) {
                    const messageId = `zmsg_${new Date().toISOString()}_n8n_${body.id || Date.now()}`;
                    
                    await supabaseAdmin.from('Mensagem').insert({
                        id: messageId,
                        clinicaId,
                        conversaId: conversa.id,
                        conteudo: mensagemTexto,
                        tipo: tipoMensagem,
                        de: isFromMe ? 'sistema' : telefone,
                        lida: isFromMe,
                        timestamp: nowDate
                    });

                    const isPerdido = !isFromMe && (['perdido', 'ltv_perdidos', 'desqualificado'].includes(conversa.kanbanAtenStat) || ['perdido', 'ltv_perdidos', 'desqualificado'].includes(conversa.kanbanVendStat));
                    
                    await supabaseAdmin.from('Conversa').update({
                        ultimaMensagem: mensagemTexto.includes('[MEDIA_URL]') ? '[Mídia]' : mensagemTexto,
                        ultimaMensagemAt: nowDate,
                        updatedAt: nowDate,
                        ...(!isFromMe && { naoLidas: (conversa.naoLidas || 0) + 1 }),
                        ...(isPerdido && { kanbanAtenStat: 'fila_espera', kanbanVendStat: 'contato_inicial' })
                    }).eq('id', conversa.id);
                }

                return NextResponse.json({ ok: true });
            }
        }

        // === MENSAGEM RECEBIDA (Native Uazapi Format) ===
        if (event === 'messages.upsert' || event === 'message.received' || event === 'MESSAGES_UPSERT') {
            const messages = data?.messages || [data]; 
            
            for (const msg of messages) {
                const isMsgFromMe = msg.fromMe || msg.key?.fromMe || (msg.pushName?.includes('Sofia'));
                const messageId = msg.key?.id || msg.id || `uaz_${Date.now()}`;
                
                fs.appendFileSync(logFile, `[UAZ NATIVE] Processando mensagem ID: ${messageId}, FromMe: ${isMsgFromMe}\n`);
                console.log(`[WEBHOOK NATIVE] Processando. fromMe: ${isMsgFromMe}, ID: ${messageId}`);

                const remoteJid = msg.key?.remoteJid || msg.remoteJid || msg.from;
                const telefone = remoteJid?.replace('@s.whatsapp.net', '')?.replace('@c.us', '');
                
                const msgData = msg.message || {};
                let conteudo = msgData.conversation || msgData.extendedTextMessage?.text || msg.body || msg.text || '';
                let tipo = 'TEXTO';
                let urlMedia = '';
                let nomeArquivo = '';

                if (msgData.imageMessage) {
                    tipo = 'IMAGEM';
                    urlMedia = msgData.imageMessage.url || '';
                    conteudo = msgData.imageMessage.caption || conteudo || '[Imagem]';
                    nomeArquivo = 'imagem.jpg';
                    fs.appendFileSync(logFile, `[UAZ NATIVE] Tipo: IMAGEM, URL: ${urlMedia}\n`);
                } else if (msgData.audioMessage) {
                    tipo = 'AUDIO';
                    urlMedia = msgData.audioMessage.url || '';
                    conteudo = '[Áudio]';
                    nomeArquivo = 'audio.ogg';
                } else if (msgData.videoMessage) {
                    tipo = 'VIDEO';
                    urlMedia = msgData.videoMessage.url || '';
                    conteudo = msgData.videoMessage.caption || conteudo || '[Vídeo]';
                    nomeArquivo = 'video.mp4';
                } else if (msgData.documentMessage) {
                    tipo = 'DOCUMENTO';
                    urlMedia = msgData.documentMessage.url || '';
                    conteudo = msgData.documentMessage.title || msgData.documentMessage.fileName || '[Documento]';
                    nomeArquivo = msgData.documentMessage.fileName || 'documento.pdf';
                }

                if (!telefone || (!conteudo && !urlMedia)) continue;

                // Deduplicação básica
                const { data: existe } = await supabaseAdmin.from('Mensagem').select('id').eq('id', messageId).single();
                if (existe) {
                    console.log(`[WEBHOOK NATIVE] Mensagem já existe: ${messageId}`);
                    continue;
                }

                // 1. Busca ou cria o lead pelo telefone
                const { data: lead, error: leadError } = await supabaseAdmin
                    .from('Lead')
                    .select('id, nome, conversa:Conversa(id, naoLidas, kanbanAtenStat, kanbanVendStat)')
                    .eq('clinicaId', clinicaId)
                    .eq('telefone', telefone)
                    .single();

                if (leadError) fs.appendFileSync(logFile, `[UAZ NATIVE] Erro ao buscar lead (${telefone}): ${leadError.message}\n`);
                
                let leadId = lead?.id;
                let conversa = (lead?.conversa as any)?.[0];
                
                if (leadId) fs.appendFileSync(logFile, `[UAZ NATIVE] Lead encontrado: ${leadId}, Conversa: ${conversa?.id || 'NÃO'}\n`);
                else fs.appendFileSync(logFile, `[UAZ NATIVE] Lead NÃO encontrado para o telefone: ${telefone}\n`);

                if (!leadId) {
                    const nome = msg.pushName || msg.sender?.name || telefone;
                    const { data: novoLead } = await supabaseAdmin
                        .from('Lead')
                        .insert({
                            id: crypto.randomUUID(),
                            clinicaId,
                            nome,
                            telefone,
                            tags: '[]',
                            createdAt: nowDate,
                            updatedAt: nowDate
                        })
                        .select()
                        .single();
                    leadId = novoLead?.id;
                }

                if (!conversa && leadId) {
                    const { data: novaConv } = await supabaseAdmin
                        .from('Conversa')
                        .insert({
                            id: crypto.randomUUID(),
                            clinicaId,
                            leadId,
                            kanbanAtenStat: 'fila_espera',
                            kanbanVendStat: 'contato_inicial',
                            createdAt: nowDate,
                            updatedAt: nowDate
                        })
                        .select()
                        .single();
                    conversa = novaConv;
                }

                // 2. Criar mensagem no banco (Workaround: salvar metadados no conteudo)
                let finalConteudo = conteudo;
                if (urlMedia) {
                    finalConteudo = `[MEDIA_URL]|${urlMedia}|${nomeArquivo}|${conteudo}`;
                }

                if (conversa) {
                    await supabaseAdmin.from('Mensagem').insert({
                        id: messageId,
                        clinicaId,
                        conversaId: conversa.id,
                        conteudo: finalConteudo,
                        tipo: tipo,
                        de: isMsgFromMe ? 'sistema' : telefone,
                        lida: isMsgFromMe,
                        timestamp: nowDate
                    });

                    const isPerdidoUaz = !isMsgFromMe && (['perdido', 'ltv_perdidos', 'desqualificado'].includes(conversa.kanbanAtenStat) || ['perdido', 'ltv_perdidos', 'desqualificado'].includes(conversa.kanbanVendStat));

                    await supabaseAdmin.from('Conversa').update({
                        ultimaMensagem: conteudo?.substring(0, 100) || '',
                        ultimaMensagemAt: nowDate,
                        updatedAt: nowDate,
                        ...(!isMsgFromMe && { naoLidas: (conversa.naoLidas || 0) + 1 }),
                        ...(isPerdidoUaz && { kanbanAtenStat: 'fila_espera', kanbanVendStat: 'contato_inicial' })
                    }).eq('id', conversa.id);
                }

            }
        }

        // === STATUS DE CONEXÃO ===
        if (event === 'connection.update' || event === 'connection-update' || event === 'CONNECTION_UPDATE') {
            const state = data?.state || data?.status;
            const conectado = state === 'open' || state === 'connected';
            
            await supabaseAdmin.from('ConfiguracaoClinica').upsert({
                clinicaId,
                whatsappConectado: conectado,
                updatedAt: nowDate
            }, { onConflict: 'clinicaId' });

            if (conectado) {
                console.log(`[UAZAPI WEBHOOK] Disparando sincronização automática para clínica: ${instance}`);
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                
                fetch(`${appUrl}/api/whatsapp/sync`, { 
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-internal-secret': process.env.UAZAPI_TOKEN || ''
                    },
                    body: JSON.stringify({ clinicaId })
                }).catch(err => console.error('[UAZAPI WEBHOOK] Erro ao disparar sync:', err));
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const logFile = 'WEBHOOK_DEBUG.log';
        fs.appendFileSync(logFile, `[CRITICAL ERROR] ${error instanceof Error ? error.message : String(error)}\n`);
        console.error('[UAZAPI WEBHOOK ERROR]', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'webhook Uazapi ativo' });
}

