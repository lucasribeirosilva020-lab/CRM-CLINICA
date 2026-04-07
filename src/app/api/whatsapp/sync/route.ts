import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';
import * as uazapi from '@/lib/uazapi';

export const POST = async (req: NextRequest) => {
    // Tenta pegar o user via middleware ou manualmente
    let clinicaId: string | undefined;

    const authHeader = req.headers.get('authorization');
    const internalSecret = req.headers.get('x-internal-secret');
    const adminToken = process.env.UAZAPI_TOKEN;

    if (internalSecret === adminToken) {
        // Chamada interna do webhook
        const body = await req.json().catch(() => ({}));
        clinicaId = body.clinicaId;
        console.log(`[SYNC] Chamada interna autorizada para clinicaId: ${clinicaId}`);
    } else {
        // Chamada normal do usuário, precisa de auth
        return withAuth(async (req: NextRequest, authUser: any) => {
            const { clinicaId } = authUser;
            return execSync(clinicaId);
        })(req, {});
    }

    if (!clinicaId) {
        return NextResponse.json({ success: false, error: 'clinicaId não fornecido' }, { status: 400 });
    }

    return execSync(clinicaId);
};

async function execSync(clinicaId: string) {
    try {
        const [clinicaRes, configRes] = await Promise.all([
            supabaseAdmin.from('Clinica').select('slug').eq('id', clinicaId).single(),
            supabaseAdmin.from('ConfiguracaoClinica').select('whatsappSessao').eq('clinicaId', clinicaId).single()
        ]);

        const clinica = clinicaRes.data;
        const config = configRes.data;

        const instanceName = clinica?.slug || `clinica-${clinicaId}`;
        const instanceToken = config?.whatsappSessao || undefined;

        console.log(`[SYNC] Iniciando sincronização para ${instanceName}`);
        
        // 1. Listar Contatos
        const contactsRes = await uazapi.listarContatos(instanceName, instanceToken);
        const contacts = contactsRes?.data || contactsRes || [];
        
        console.log(`[SYNC] ${contacts.length} contatos encontrados.`);

        const nowDate = new Date().toISOString();

        for (const contact of contacts) {
            const remoteJid = contact.id || contact.remoteJid;
            const telefone = remoteJid?.split('@')[0];
            const nome = contact.name || contact.pushname || telefone;

            if (!telefone) continue;

            const { error: upsertError } = await supabaseAdmin
                .from('Lead')
                .upsert({
                    id: crypto.randomUUID(), // O Supabase vai ignorar se for update ou lidar via onConflict se passarmos ID, mas aqui o conflito é clinicaId_telefone
                    clinicaId,
                    nome,
                    telefone,
                    tags: '[]',
                    updatedAt: nowDate
                }, { onConflict: 'clinicaId,telefone' });
            
            if (upsertError) console.error(`[SYNC] Erro ao dar upsert no lead ${telefone}:`, upsertError);
        }

        // 2. Listar Conversas e Mensagens
        const chatsRes = await uazapi.listarConversas(instanceName, instanceToken);
        const chats = chatsRes?.data || chatsRes || [];

        console.log(`[SYNC] ${chats.length} conversas encontradas.`);

        for (const chat of chats) {
            const remoteJid = chat.id || chat.remoteJid;
            const telefone = remoteJid?.split('@')[0];
            if (!telefone) continue;

            // Busca o lead correspondente
            const { data: lead, error: leadFetchError } = await supabaseAdmin
                .from('Lead')
                .select('id')
                .eq('clinicaId', clinicaId)
                .eq('telefone', telefone)
                .single();

            if (leadFetchError || !lead) continue;

            const lastMsgContent = chat.lastMessage?.message?.conversation || chat.lastMessage?.body || '';

            // Cria ou busca a conversa
            const { data: conversa, error: convError } = await supabaseAdmin
                .from('Conversa')
                .upsert({
                    id: crypto.randomUUID(),
                    clinicaId,
                    leadId: lead.id,
                    kanbanAtenStat: 'fila_espera',
                    ultimaMensagem: lastMsgContent,
                    ultimaMensagemAt: nowDate,
                    updatedAt: nowDate
                }, { onConflict: 'leadId' })
                .select()
                .single();

            if (convError || !conversa) {
                console.error(`[SYNC] Erro ao criar/atualizar conversa para ${telefone}:`, convError);
                continue;
            }

            // 3. Buscar mensagens detalhadas (Deep Sync)
            try {
                const msgsRes = await uazapi.buscarMensagens(instanceName, remoteJid, instanceToken);
                const messages = msgsRes?.data || msgsRes || [];
                
                if (Array.isArray(messages)) {
                    for (const m of messages) {
                        const msgId = m.id?.id || m.id || crypto.randomUUID();
                        const fromMe = m.key?.fromMe || m.fromMe || false;
                        const timestampRaw = m.messageTimestamp || m.timestamp;
                        const msgDate = new Date(Number(timestampRaw) * 1000 || Date.now()).toISOString();
                        
                        // Determina o remetente
                        const de = fromMe ? 'usuario' : telefone;
                        
                        // Extrai o conteúdo e metadados de mídia
                        const msgData = m.message || {};
                        let conteudo = msgData.conversation || msgData.extendedTextMessage?.text || m.body || m.content || m.text || '';
                        let tipo = 'TEXTO';
                        let urlMedia = '';
                        let nomeArquivo = '';

                        if (msgData.imageMessage) {
                            tipo = 'IMAGEM';
                            urlMedia = msgData.imageMessage.url || '';
                            conteudo = msgData.imageMessage.caption || conteudo || '[Imagem]';
                            nomeArquivo = 'imagem.jpg';
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

                        let finalConteudo = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);
                        if (urlMedia) {
                            finalConteudo = `[MEDIA_URL]|${urlMedia}|${nomeArquivo}|${conteudo}`;
                        }

                        const { error: msgUpsertError } = await supabaseAdmin
                            .from('Mensagem')
                            .upsert({
                                id: msgId,
                                clinicaId,
                                conversaId: (conversa as any).id,
                                conteudo: finalConteudo,
                                tipo: tipo,
                                de,
                                lida: true,
                                timestamp: msgDate
                            }, { onConflict: 'id' });

                        
                        if (msgUpsertError) console.error(`[SYNC] Erro ao salvar mensagem ${msgId}:`, msgUpsertError);
                    }
                }
            } catch (msgErr) {
                console.error(`[SYNC] Erro ao buscar mensagens para ${remoteJid}:`, msgErr);
            }
        }

        return NextResponse.json({ success: true, message: 'Sincronização concluída' });

    } catch (error: any) {
        console.error('[SYNC] Erro fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

