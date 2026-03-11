import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
                    kanbanAtenStat,
                    kanbanVendStat,
                    ultimaMensagem,
                    ultimaMensagemAt,
                    naoLidas
                )
            `)
            .eq('clinicaId', clinicaId)
            .order('updatedAt', { ascending: false });

        if (q) {
            query = query.or(`nome.ilike.%${q}%,telefone.ilike.%${q}%`);
        }

        const { data: leads, error: supError } = await query;

        if (supError) {
            console.error('[GET LEADS] Erro Supabase:', supError);
            return NextResponse.json({ success: false, error: supError.message }, { status: 500 });
        }

        // Formatar para o frontend esperar o formato que já usava no mock
        const leadsFormatados = leads.map((l: any) => ({
            id: l.id,
            nome: l.nome,
            telefone: l.telefone,
            tags: l.tags ? JSON.parse(l.tags) : [],
            valor: l.valor,
            busca: l.busca,
            ultimaMensagem: l.conversa?.ultimaMensagem || '',
            ultimaMensagemAt: l.conversa?.ultimaMensagemAt || l.updatedAt,
            naoLidas: l.conversa?.naoLidas || 0,
            kanbanAtenStat: l.conversa?.kanbanAtenStat || 'novo_lead',
            minutosSemResposta: l.conversa?.ultimaMensagemAt
                ? Math.floor((Date.now() - new Date(l.conversa.ultimaMensagemAt).getTime()) / 60000)
                : 0
        }));

        return NextResponse.json({ success: true, data: leadsFormatados });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
