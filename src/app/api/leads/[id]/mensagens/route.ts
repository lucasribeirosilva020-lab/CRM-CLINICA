import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';
import * as uazapi from '@/lib/uazapi';
import fs from 'fs';

export const GET = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;

        // 1. Buscar lead e suas mensagens via Conversa
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('Lead')
            .select(`
                id, clinicaId,
                conversa:Conversa (
                    id,
                    mensagens:Mensagem (
                        id, conteudo, de, timestamp, lida, tipo
                    )
                )
            `)
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            console.error('[GET MESSAGES] Lead não encontrado:', leadError);
            return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
        }

        if (lead.clinicaId !== clinicaId) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const mensagensRaw = (lead.conversa as any)?.[0]?.mensagens || [];
        
        // Ordenar por ID ASC (os cuid() são sequenciais e mais confiáveis que timestamp em caso de troca de fuso)
        const mensagensOrdenadas = [...mensagensRaw].sort((a: any, b: any) => 
            a.id.localeCompare(b.id)
        );

        const mensagensFormatadas = mensagensOrdenadas.map((m: any) => {
            let finalUrl = undefined;
            let finalNomeArquivo = undefined;
            let finalConteudo = m.conteudo;

            // Tenta extrair URL e nome do arquivo se o conteúdo tiver o padrão de metadados [MEDIA_URL]|...
            if (m.conteudo?.startsWith('[MEDIA_URL]|')) {
                const parts = m.conteudo.split('|');
                finalUrl = parts[1];
                finalNomeArquivo = parts[2];
                finalConteudo = parts[3] || '';
            }

            return {
                id: m.id,
                conteudo: finalConteudo,
                de: m.de,
                timestamp: m.timestamp?.endsWith('Z') ? m.timestamp : `${m.timestamp}Z`,
                lida: m.lida,
                tipo: (m.tipo || 'TEXTO').toLowerCase(),
                url: finalUrl,
                nomeArquivo: finalNomeArquivo
            };
        });

        return NextResponse.json({ success: true, data: mensagensFormatadas });
    } catch (error: any) {
        console.error('[GET MESSAGES] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});


export const POST = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;
        const { conteudo, tipo, de, url, nomeArquivo } = await req.json();
        
        const nowDate = new Date().toISOString();

        console.log(`[POST MESSAGE] LeadId: ${leadId}, ClinicaId: ${clinicaId}, Tipo: ${tipo}`);

        // 1. Validar lead e buscar configurações da clínica
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('Lead')
            .select(`
                id, clinicaId, telefone,
                conversa:Conversa (id, ultimaMensagem, ultimaMensagemAt, naoLidas),
                clinica:Clinica (
                    slug, nome,
                    configuracoes:ConfiguracaoClinica (whatsappModo, webhookN8nUrl, whatsappSessao)
                )
            `)
            .eq('id', leadId)
            .single();

        if (leadError || !lead) {
            return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
        }

        if (lead.clinicaId !== clinicaId) {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const clinica = lead.clinica as any;
        const config = clinica?.configuracoes?.[0];
        const instanceName = clinica?.slug || uazapi.sanitizarNomeInstancia(clinica?.nome || `clinica-${clinicaId}`);
        const instanceToken = config?.whatsappSessao ?? undefined;
        const numeroDestino = lead.telefone.replace(/\D/g, '');
        
        // 2. Buscar ou criar conversa
        let conversa = (lead.conversa as any)?.[0];

        if (!conversa) {
            console.log('[POST MESSAGE] Criando nova Conversa para lead:', leadId);
            const { data: novaConv, error: convError } = await supabaseAdmin
                .from('Conversa')
                .insert({
                    id: crypto.randomUUID(),
                    leadId,
                    clinicaId,
                    ultimaMensagem: conteudo?.substring(0, 100) || '',
                    ultimaMensagemAt: nowDate,
                    naoLidas: 0,
                    createdAt: nowDate,
                    updatedAt: nowDate
                })
                .select()
                .single();
            
            if (convError) throw convError;
            conversa = novaConv;
        }

        // 3. Criar mensagem no banco (Workaround: salvar metadados no conteudo)
        let finalConteudo = conteudo;
        if (url) {
            finalConteudo = `[MEDIA_URL]|${url}|${nomeArquivo || ''}|${conteudo || ''}`;
        }

        // Para resolver o problema de fuso horário (UTC vs Brasil/GMT-3)
        // Se o servidor envia ISO puro, o frontend às vezes não converte. 
        // Vamos forçar o fuso de Brasília para exibição correta.
        const sortableId = `zmsg_${nowDate}_${crypto.randomUUID()}`;

        const { data: novaMensagem, error: msgError } = await supabaseAdmin
            .from('Mensagem')
            .insert({
                id: sortableId,
                clinicaId,
                conversaId: conversa.id,
                conteudo: finalConteudo,
                tipo: tipo || 'TEXTO',
                de: de || 'sistema',
                lida: true,
                timestamp: nowDate
            })
            .select()
            .single();

        if (msgError) throw msgError;

        // 4. Envio de WhatsApp (Uazapi ou n8n)
        const modo = config?.whatsappModo || 'uazapi';
        const msgTipo = tipo || 'TEXTO';

        try {
            if (modo === 'uazapi' && instanceName) {
                if (msgTipo === 'TEXTO' || !msgTipo) {
                    await uazapi.enviarMensagem(instanceName, numeroDestino, conteudo, instanceToken);
                } else if (['IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO'].includes(msgTipo)) {
                    const uazType = msgTipo === 'IMAGEM' ? 'IMAGE' : 
                                   msgTipo === 'AUDIO' ? 'AUDIO' : 
                                   msgTipo === 'VIDEO' ? 'VIDEO' : 'DOCUMENT';
                    
                    await uazapi.enviarMedia(instanceName, numeroDestino, url, uazType, conteudo, instanceToken);
                }
            } else if (modo === 'n8n' && config?.webhookN8nUrl) {
                // Modo n8n (o fluxo do cliente irá capturar isso)
                console.log(`[n8n] Iniciando fetch para URL: ${config.webhookN8nUrl}`);
                const payload = {
                    Numero: numeroDestino,
                    from: numeroDestino,
                    remoteJid: `${numeroDestino}@s.whatsapp.net`,
                    Mensagem: conteudo,
                    fromMe: true,
                    id: `CRM_${Date.now()}`,
                    chatid: `${numeroDestino}@s.whatsapp.net`,
                    text: conteudo,
                    // Estrutura específica que o seu nó "Dados1" espera:
                    message: {
                        sender_pn: numeroDestino,
                        text: conteudo,
                        content: conteudo,
                        senderName: user.nome || 'CRM',
                        fromMe: true
                    },
                    chat: {
                        wa_chatid: `${numeroDestino}@s.whatsapp.net`
                    },
                    data: {
                        remoteJid: `${numeroDestino}@s.whatsapp.net`,
                        from: numeroDestino,
                        messages: [{
                            key: { remoteJid: `${numeroDestino}@s.whatsapp.net`, fromMe: true },
                            message: { conversation: conteudo }
                        }]
                    },
                    clinicaId,
                    clínicaId: clinicaId, // Com acento para o caso do seu webhook
                    url,
                    nomeArquivo,
                    tipo: msgTipo,
                    instance: instanceName,
                    token: instanceToken,
                    // Redundância máxima para n8n
                    body: {
                        Numero: numeroDestino,
                        from: numeroDestino,
                        remoteJid: `${numeroDestino}@s.whatsapp.net`,
                        Mensagem: conteudo,
                        text: conteudo,
                        instance: instanceName,
                        token: instanceToken,
                        clinicaId: clinicaId,
                        url,
                        tipo: msgTipo
                    }
                };
                

                fs.appendFileSync('debug_whatsapp_FINAL.log', `[n8n SEND] URL: ${config.webhookN8nUrl}\n[n8n SEND] Payload: ${JSON.stringify(payload)}\n`);

                const n8nRes = await fetch(config.webhookN8nUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const resText = await n8nRes.text();
                fs.appendFileSync('debug_whatsapp_FINAL.log', `[n8n SEND] Resposta: ${n8nRes.status} - ${resText}\n`);
            }

        } catch (whatsappError: any) {
            console.error('[SEND ERROR] Falha no envio externo:', whatsappError.message);
            // Não falhamos a rota se o envio externo falhar, pois a msg já está no banco do CRM
        }

        // 5. Atualizar resumo da conversa
        const { error: updateConvError } = await supabaseAdmin
            .from('Conversa')
            .update({
                ultimaMensagem: (tipo === 'NOTA' || tipo === 'nota') ? (conversa.ultimaMensagem || '') : (conteudo?.substring(0, 100) || ''),
                ultimaMensagemAt: nowDate,
                ...(de !== 'sistema' && { naoLidas: (conversa.naoLidas || 0) + 1 }),
                updatedAt: nowDate
            })
            .eq('id', conversa.id);

        if (updateConvError) console.error('[POST MESSAGE] Erro ao atualizar conversa:', updateConvError);

        return NextResponse.json({ success: true, data: novaMensagem });
    } catch (error: any) {
        console.error('[POST MESSAGE] Erro Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});


