import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { enviarMensagem } from '@/lib/evolution';

export const GET = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;

        const { data: lead, error: supError } = await supabaseAdmin
            .from('Lead')
            .select(`
                *,
                conversa:Conversa (
                    *,
                    mensagens:Mensagem (*)
                )
            `)
            .eq('id', leadId)
            .eq('clinicaId', clinicaId)
            .single();

        if (supError || !lead) {
            if (supError) console.error('[GET MESSAGES] Erro Supabase:', supError);
            return NextResponse.json({ success: false, error: 'Lead não encontrado ou acesso negado' }, { status: 404 });
        }

        const mensagensFormatadas = (lead.conversa?.mensagens || []).map((m: any) => ({
            id: m.id,
            conteudo: m.conteudo,
            de: m.de,
            timestamp: typeof m.timestamp === 'string' ? m.timestamp : m.timestamp.toISOString(),
            lida: m.lida,
            tipo: (m.tipo || 'TEXTO').toLowerCase() as any,
            url: m.url,
            nomeArquivo: m.nomeArquivo
        })).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return NextResponse.json({ success: true, data: mensagensFormatadas });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

export const POST = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;
        const body = await req.json();
        const { conteudo, tipo, de, url, nomeArquivo } = body;

        console.log(`[POST MESSAGE] LeadId: ${leadId}, ClinicaId: ${clinicaId}, Tipo: ${tipo}`);

        // 1. Validar lead e buscar sessão do WhatsApp
        const { data: lead, error: leadError } = await supabaseAdmin
            .from('Lead')
            .select('*, conversa:Conversa(*), clinica:Clinica(ConfiguracaoClinica(*))')
            .eq('id', leadId)
            .eq('clinicaId', clinicaId)
            .single();

        if (leadError || !lead) {
            console.error('[POST MESSAGE] Erro ao buscar lead:', leadError);
            return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
        }

        const conversa = Array.isArray(lead.conversa) ? lead.conversa[0] : lead.conversa;
        if (!conversa) {
            console.error('[POST MESSAGE] Lead sem conversa associada');
            return NextResponse.json({ success: false, error: 'Conversa não encontrada' }, { status: 404 });
        }

        // 2. Criar mensagem no banco de dados local
        const { data: novaMensagem, error: msgError } = await supabaseAdmin
            .from('Mensagem')
            .insert({
                clinicaId,
                conversaId: conversa.id,
                conteudo,
                tipo: tipo || 'TEXTO',
                de: de || 'sistema',
                lida: true,
                url: url || null,
                nomeArquivo: nomeArquivo || null,
                timestamp: new Date().toISOString()
            })
            .select()
            .single();

        if (msgError) {
            console.error('[POST MESSAGE] Erro ao inserir mensagem:', msgError);
            throw msgError;
        }

        // 3. Enviar via Evolution API se for 'sistema' (fora o modo NOTA)
        if (de === 'sistema' && tipo !== 'NOTA' && tipo !== 'nota') {
            const config = lead.clinica?.ConfiguracaoClinica;
            // No PostgREST, se for 1:1, pode vir como objeto ou array
            const settings = Array.isArray(config) ? config[0] : config;
            const instanceName = settings?.whatsappSessao;

            if (instanceName && settings?.whatsappConectado) {
                try {
                    await enviarMensagem(instanceName, lead.telefone, conteudo);
                    console.log(`[POST MESSAGE] Mensagem enviada via Evolution para ${lead.telefone}`);
                } catch (evolError) {
                    console.error('[POST MESSAGE] Erro ao enviar via Evolution API:', evolError);
                }
            } else {
                console.warn('[POST MESSAGE] Instância do WhatsApp não configurada ou desconectada');
            }
        }

        // 4. Atualizar resumo da conversa
        const updateData: any = {
            ultimaMensagem: tipo === 'NOTA' || tipo === 'nota' ? conversa.ultimaMensagem : conteudo.substring(0, 100),
            ultimaMensagemAt: new Date().toISOString()
        };

        if (de !== 'sistema') {
            updateData.naoLidas = (conversa.naoLidas || 0) + 1;
        }

        await supabaseAdmin.from('Conversa').update(updateData).eq('id', conversa.id);

        return NextResponse.json({ success: true, data: novaMensagem });
    } catch (error: any) {
        console.error('[POST MESSAGE] Erro Fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
