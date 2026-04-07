import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        const { clinicaId } = user;
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q') || '';

        let query = supabaseAdmin
            .from('Lead')
            .select(`
                id, nome, telefone, tags, valor, busca, origem, updatedAt,
                conversa:Conversa (
                    id,
                    atendenteId,
                    kanbanAtenStat,
                    kanbanVendStat,
                    ultimaMensagem,
                    ultimaMensagemAt,
                    naoLidas
                )
            `)
            .eq('clinicaId', clinicaId)
            .order('updatedAt', { ascending: false })
            .limit(100);

        if (q) {
            query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`);
        }

        const { data: leads, error: supError } = await query;

        if (supError) {
            console.error('[GET LEADS] Erro Supabase:', supError);
            return NextResponse.json({ success: false, error: supError.message }, { status: 500 });
        }

        const leadsFormatados = leads.map((l: any) => {
            const conversa = Array.isArray(l.conversa) ? l.conversa[0] : l.conversa;
            return {
                id: l.id,
                nome: l.nome,
                telefone: l.telefone,
                tags: (() => { try { return l.tags ? JSON.parse(l.tags) : []; } catch { return []; } })(),
                valor: l.valor,
                busca: l.busca,
                atribuidoA: conversa?.atendenteId || null,
                ultimaMensagem: conversa?.ultimaMensagem || '',
                ultimaMensagemAt: conversa?.ultimaMensagemAt || l.updatedAt,
                naoLidas: conversa?.naoLidas || 0,
                kanbanAtenStat: conversa?.kanbanAtenStat || 'fila_espera',
                kanbanVendStat: conversa?.kanbanVendStat || 'contato_inicial',
                minutosSemResposta: conversa?.ultimaMensagemAt
                    ? Math.floor((Date.now() - new Date(conversa.ultimaMensagemAt).getTime()) / 60000)
                    : 0
            };
        });

        return NextResponse.json({ success: true, data: leadsFormatados });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        const { clinicaId } = user;
        const body = await req.json();
        const { nome, telefone, busca, origem, tags } = body;

        if (!nome || !telefone) {
            return NextResponse.json({ success: false, error: 'Nome e telefone são obrigatórios' }, { status: 400 });
        }

        const leadId = crypto.randomUUID();
        const nowDate = new Date().toISOString();
        // 1. Criar o Lead
        const { data: novoLead, error: leadError } = await supabaseAdmin
            .from('Lead')
            .insert({
                id: leadId,
                clinicaId,
                nome: nome.trim(),
                telefone: telefone.replace(/\D/g, ''),
                busca: busca || null,
                origem: origem || 'MANUAL',
                tags: tags ? JSON.stringify(tags) : JSON.stringify([]),
                createdAt: nowDate,
                updatedAt: nowDate,
            })
            .select()
            .single();

        if (leadError || !novoLead) {
            console.error('[POST LEAD] Erro ao criar lead:', leadError);
            return NextResponse.json({ success: false, error: leadError?.message || 'Erro ao criar lead' }, { status: 500 });
        }

        // 2. Criar Conversa automaticamente (ESSENCIAL para o botão de enviar funcionar)
        const { error: convError } = await supabaseAdmin
            .from('Conversa')
            .insert({
                id: crypto.randomUUID(),
                leadId: novoLead.id,
                clinicaId,
                kanbanAtenStat: 'fila_espera',
                kanbanVendStat: 'contato_inicial',
                ultimaMensagem: '',
                ultimaMensagemAt: nowDate,
                naoLidas: 0,
                createdAt: nowDate,
                updatedAt: nowDate,
            });

        if (convError) {
            console.error('[POST LEAD] Aviso: Erro ao criar conversa:', convError);
        }

        const leadFormatado = {
            id: novoLead.id,
            nome: novoLead.nome,
            telefone: novoLead.telefone,
            tags: tags || [],
            valor: null,
            busca: novoLead.busca,
            atribuidoA: null,
            ultimaMensagem: '',
            ultimaMensagemAt: new Date().toISOString(),
            naoLidas: 0,
            kanbanAtenStat: 'fila_espera',
            minutosSemResposta: 0,
        };

        return NextResponse.json({ success: true, data: leadFormatado });
    } catch (error: any) {
        console.error('[POST LEAD] Erro fatal:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
