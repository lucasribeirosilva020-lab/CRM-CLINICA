import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const GET = withAuth(async (req: Request, user: any) => {
    try {
        const { clinicaId } = user;

        // 1. Total Vendido (Considerando qualquer um dos kanbans como Ganho)
        const { data: conversasGanhas, error: vError } = await supabaseAdmin
            .from('Conversa')
            .select('lead:Lead(valor)')
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho');

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

        // 3. Conversões (Deste mês)
        const { count: conversoes, error: cError } = await supabaseAdmin
            .from('Conversa')
            .select('*', { count: 'exact', head: true })
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho')
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
                id,
                nome,
                conversasAtrib:Conversa (
                    kanbanVendStat,
                    kanbanAtenStat,
                    lead:Lead(valor)
                )
            `)
            .eq('clinicaId', clinicaId)
            .in('perfil', ['VENDEDOR', 'ATENDENTE'])
            .eq('ativo', true);

        if (rError) throw rError;

        // 6. Meta Global e Individuais
        const { data: metasDoc, error: mError } = await supabaseAdmin
            .from('Meta')
            .select('valorMeta, vendedorId')
            .eq('clinicaId', clinicaId)
            .eq('mes', mesAtual)
            .eq('ano', anoAtual);

        if (mError) throw mError;
        
        let metaGlobal = 100000;
        const metasIndividuais: Record<string, number> = {};
        if (metasDoc) {
            metasDoc.forEach((m: any) => {
                if (m.vendedorId === null) metaGlobal = m.valorMeta;
                else metasIndividuais[m.vendedorId] = m.valorMeta;
            });
        }

        const rankingFormatado = (rankingVendedores as any[]).map((v: any) => {
            const vendasGanhas = v.conversasAtrib.filter((c: any) => c.kanbanVendStat === 'ganho' || c.kanbanAtenStat === 'ganho');
            return {
                id: v.id,
                nome: v.nome,
                vendas: vendasGanhas.reduce((acc: number, c: any) => acc + (c.lead?.valor || 0), 0),
                conversoes: vendasGanhas.length,
                meta: metasIndividuais[v.id] || Math.round(metaGlobal / ((rankingVendedores as any[]).length || 1))
            };
        }).sort((a: any, b: any) => b.vendas - a.vendas);

        // 7. Dados Mensais (Últimos 6 Meses)
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
        seisMesesAtras.setDate(1);
        seisMesesAtras.setHours(0, 0, 0, 0);

        const { data: leadsHist } = await supabaseAdmin
            .from('Lead')
            .select('createdAt')
            .eq('clinicaId', clinicaId)
            .gte('createdAt', seisMesesAtras.toISOString());

        const { data: vendasHist } = await supabaseAdmin
            .from('Conversa')
            .select('updatedAt, kanbanVendStat, kanbanAtenStat, lead:Lead(valor)')
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho')
            .gte('updatedAt', seisMesesAtras.toISOString());

        const historicoMeses = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
                mes: d.toLocaleDateString('pt-BR', { month: 'short' }),
                monthNum: d.getMonth(),
                year: d.getFullYear(),
                leads: 0,
                receita: 0
            };
        });

        if (leadsHist) {
            leadsHist.forEach((l: any) => {
                const date = new Date(l.createdAt);
                const match = historicoMeses.find(m => m.monthNum === date.getMonth() && m.year === date.getFullYear());
                if (match) match.leads++;
            });
        }
        if (vendasHist) {
            vendasHist.forEach((v: any) => {
                const date = new Date(v.updatedAt);
                const match = historicoMeses.find(m => m.monthNum === date.getMonth() && m.year === date.getFullYear());
                if (match) match.receita += (v.lead?.valor || 0);
            });
        }

        // 8. Vendas Semanais (Comparativo)
        const agora_v = new Date();
        const diaSemana = agora_v.getDay(); // 0 (Dom) a 6 (Sab)
        const diff = agora_v.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Segunda-feira desta semana
        const inicioSemanaAtual = new Date(agora_v.setDate(diff));
        inicioSemanaAtual.setHours(0, 0, 0, 0);

        const inicioSemanaAnterior = new Date(inicioSemanaAtual);
        inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

        const { data: vendasSemanaAtual } = await supabaseAdmin
            .from('Conversa')
            .select('updatedAt, kanbanVendStat, kanbanAtenStat, lead:Lead(valor)')
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho')
            .gte('updatedAt', inicioSemanaAtual.toISOString());

        const { data: vendasSemanaAnterior } = await supabaseAdmin
            .from('Conversa')
            .select('updatedAt, kanbanVendStat, kanbanAtenStat, lead:Lead(valor)')
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho')
            .gte('updatedAt', inicioSemanaAnterior.toISOString())
            .lt('updatedAt', inicioSemanaAtual.toISOString());

        const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
        const vendasSemanais = diasSemana.map((dia, i) => {
            const getVendaDia = (data: any[]) => {
                return (data || []).reduce((acc, v) => {
                    const d = new Date(v.updatedAt);
                    const ds = d.getDay();
                    const index = ds === 0 ? 6 : ds - 1;
                    return index === i ? acc + (v.lead?.valor || 0) : acc;
                }, 0);
            };
            return {
                semana: dia,
                atual: getVendaDia(vendasSemanaAtual || []),
                anterior: getVendaDia(vendasSemanaAnterior || [])
            };
        });

        // 9. Atividade Recente
        const { data: novosLeadsFull } = await supabaseAdmin
            .from('Lead')
            .select('id, nome, createdAt')
            .eq('clinicaId', clinicaId)
            .order('createdAt', { ascending: false })
            .limit(3);

        const { data: vendasRecentes } = await supabaseAdmin
            .from('Conversa')
            .select('updatedAt, kanbanVendStat, kanbanAtenStat, lead:Lead(nome, valor)')
            .eq('clinicaId', clinicaId)
            .or('kanbanVendStat.eq.ganho,kanbanAtenStat.eq.ganho')
            .order('updatedAt', { ascending: false })
            .limit(3);

        const { data: transfers } = await supabaseAdmin
            .from('Transferencia')
            .select('timestamp, de:Usuario!TransferidoPor(nome), para:Usuario!TransferidoPara(nome), conversa:Conversa(lead:Lead(nome))')
            .eq('clinicaId', clinicaId)
            .order('timestamp', { ascending: false })
            .limit(3);

        const recentActivity: any[] = [];
        
        if (novosLeadsFull) {
            novosLeadsFull.forEach((l: any) => {
                recentActivity.push({
                    id: `l-${l.id}`,
                    tipo: 'lead',
                    titulo: 'Novo Lead Recebido',
                    descricao: `Lead ${l.nome} entrou no funil.`,
                    data: l.createdAt
                });
            });
        }

        if (vendasRecentes) {
            vendasRecentes.forEach((v: any, i: number) => {
                recentActivity.push({
                    id: `v-${i}`,
                    tipo: 'venda',
                    titulo: 'Venda Realizada! 🎉',
                    descricao: `Lead ${v.lead?.nome} fechou por R$ ${v.lead?.valor}.`,
                    data: v.updatedAt
                });
            });
        }

        if (transfers) {
            transfers.forEach((t: any, i: number) => {
                recentActivity.push({
                    id: `t-${i}`,
                    tipo: 'transferencia',
                    titulo: 'Atendimento Transferido',
                    descricao: `${t.de?.nome.split(' ')[0]} transferiu ${t.conversa?.lead?.nome} para ${t.para?.nome.split(' ')[0]}.`,
                    data: t.timestamp
                });
            });
        }

        const sortedActivity = recentActivity
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 5);

        return NextResponse.json({
            success: true,
            data: {
                metrics: {
                    totalVendido,
                    novosLeads: novosLeads || 0,
                    conversoes: conversoes || 0,
                    taxaConversao: (novosLeads || 0) > 0 ? Math.round(((conversoes || 0) / (novosLeads || 0)) * 100) : 0,
                    metaGlobal: metaGlobal,
                    ticketMedio: (conversoes || 0) > 0 ? Math.round(totalVendido / (conversoes || 0)) : 0,
                    tempoMedio: "0h 45min"
                },
                leadsPorStatus: Object.keys(groupedStatus).map(nome => ({
                    nome,
                    valor: groupedStatus[nome]
                })),
                rankingVendedores: rankingFormatado,
                historicoMensal: historicoMeses,
                vendasSemanais: vendasSemanais,
                recentActivity: sortedActivity
            }
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
