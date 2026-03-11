import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const GET = withAuth(async (req: Request, user: any) => {
    try {
        const { clinicaId } = user;

        // 1. Total Vendido
        const { data: conversasGanhas, error: vError } = await supabaseAdmin
            .from('Conversa')
            .select('lead:Lead(valor)')
            .eq('clinicaId', clinicaId)
            .eq('kanbanVendStat', 'ganho');

        if (vError) throw vError;
        const totalVendido = (conversasGanhas as any[]).reduce((acc, c) => acc + (c.lead?.valor || 0), 0);

        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        const agora = new Date();
        const mesAtual = agora.getMonth() + 1;
        const anoAtual = agora.getFullYear();

        // 2. Novos Leads
        const { count: novosLeads, error: lError } = await supabaseAdmin
            .from('Lead')
            .select('*', { count: 'exact', head: true })
            .eq('clinicaId', clinicaId)
            .gte('createdAt', inicioMes.toISOString());

        if (lError) throw lError;

        // 3. Conversões
        const { count: conversoes, error: cError } = await supabaseAdmin
            .from('Conversa')
            .select('*', { count: 'exact', head: true })
            .eq('clinicaId', clinicaId)
            .eq('kanbanVendStat', 'ganho')
            .gte('updatedAt', inicioMes.toISOString());

        if (cError) throw cError;

        // 4. Leads por Status
        const { data: statusCounts, error: sError } = await supabaseAdmin
            .from('Conversa')
            .select('kanbanAtenStat')
            .eq('clinicaId', clinicaId);

        if (sError) throw sError;

        const groupedStatus = (statusCounts as any[]).reduce((acc: any, curr: any) => {
            acc[curr.kanbanAtenStat] = (acc[curr.kanbanAtenStat] || 0) + 1;
            return acc;
        }, {});

        // 5. Ranking de Vendedores
        const { data: rankingVendedores, error: rError } = await supabaseAdmin
            .from('Usuario')
            .select(`
                nome,
                conversasAtrib:Conversa (
                    kanbanVendStat,
                    lead:Lead(valor)
                )
            `)
            .eq('clinicaId', clinicaId)
            .eq('perfil', 'VENDEDOR')
            .eq('ativo', true);

        if (rError) throw rError;

        const rankingFormatado = (rankingVendedores as any[]).map((v: any) => {
            const vendasGanhas = v.conversasAtrib.filter((c: any) => c.kanbanVendStat === 'ganho');
            return {
                nome: v.nome,
                vendas: vendasGanhas.reduce((acc: number, c: any) => acc + (c.lead?.valor || 0), 0),
                conversoes: vendasGanhas.length
            };
        }).sort((a: any, b: any) => b.vendas - a.vendas);

        // 6. Meta Global
        const { data: metaDoc, error: mError } = await supabaseAdmin
            .from('Meta')
            .select('valorMeta')
            .eq('clinicaId', clinicaId)
            .eq('mes', mesAtual)
            .eq('ano', anoAtual)
            .is('vendedorId', null)
            .maybeSingle();

        if (mError) throw mError;

        return NextResponse.json({
            success: true,
            data: {
                metrics: {
                    totalVendido,
                    novosLeads: novosLeads || 0,
                    conversoes: conversoes || 0,
                    taxaConversao: (novosLeads || 0) > 0 ? Math.round(((conversoes || 0) / (novosLeads || 0)) * 100) : 0,
                    metaGlobal: metaDoc?.valorMeta || 100000,
                    ticketMedio: (conversoes || 0) > 0 ? Math.round(totalVendido / (conversoes || 0)) : 0,
                    tempoMedio: "0h 45min"
                },
                leadsPorStatus: Object.keys(groupedStatus).map(nome => ({
                    nome,
                    valor: groupedStatus[nome]
                })),
                rankingVendedores: rankingFormatado
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
