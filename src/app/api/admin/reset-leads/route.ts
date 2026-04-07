import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * POST /api/admin/reset-leads
 * Apaga TODOS os leads da clínica e cria um lead de teste com Conversa.
 * APENAS ADMIN pode usar.
 */
export const POST = withAuth(async (_req: NextRequest, user: any) => {
    const { clinicaId } = user;

    try {
        // 1. Buscar todos os leads da clínica
        const { data: leads } = await supabaseAdmin
            .from('Lead')
            .select('id')
            .eq('clinicaId', clinicaId);

        const leadIds = (leads || []).map((l: any) => l.id);

        if (leadIds.length > 0) {
            // Apagar mensagens ligadas às conversas desses leads
            const { data: conversas } = await supabaseAdmin
                .from('Conversa')
                .select('id')
                .in('leadId', leadIds);

            const conversaIds = (conversas || []).map((c: any) => c.id);

            if (conversaIds.length > 0) {
                await supabaseAdmin.from('Mensagem').delete().in('conversaId', conversaIds);
                await supabaseAdmin.from('Conversa').delete().in('id', conversaIds);
            }

            // Apagar os leads
            await supabaseAdmin.from('Lead').delete().in('id', leadIds);
        }

        // 2. Criar lead de teste
        const nowDateAdmin = new Date().toISOString();
        const { data: novoLead, error: leadError } = await supabaseAdmin
            .from('Lead')
            .insert({
                id: crypto.randomUUID(),
                clinicaId,
                nome: 'Lead Teste',
                telefone: '5511999990001',
                tags: JSON.stringify(['Google ADS']),
                busca: 'Consulta Teste',
                origem: 'MANUAL',
                createdAt: nowDateAdmin,
                updatedAt: nowDateAdmin,
            })
            .select()
            .single();

        if (leadError || !novoLead) {
            return NextResponse.json({ success: false, error: 'Erro ao criar lead', detail: leadError }, { status: 500 });
        }

        // 3. Criar Conversa para o lead
        const { data: novaConversa, error: convError } = await supabaseAdmin
            .from('Conversa')
            .insert({
                id: crypto.randomUUID(),
                leadId: novoLead.id,
                clinicaId,
                kanbanAtenStat: 'novo_lead',
                kanbanVendStat: 'novo_lead',
                ultimaMensagem: 'Conversa criada para teste',
                ultimaMensagemAt: nowDateAdmin,
                naoLidas: 0,
                createdAt: nowDateAdmin,
                updatedAt: nowDateAdmin,
            })
            .select()
            .single();

        if (convError || !novaConversa) {
            return NextResponse.json({ success: false, error: 'Erro ao criar conversa', detail: convError }, { status: 500 });
        }

        // 4. Criar uma mensagem inicial
        await supabaseAdmin.from('Mensagem').insert({
            id: crypto.randomUUID(),
            conversaId: novaConversa.id,
            clinicaId,
            conteudo: 'Olá! Este é um lead de teste.',
            tipo: 'TEXTO',
            de: 'lead',
            lida: true,
            timestamp: nowDateAdmin,
        });

        return NextResponse.json({
            success: true,
            message: `${leadIds.length} lead(s) antigo(s) removido(s). Lead de teste criado com sucesso.`,
            lead: { id: novoLead.id, nome: novoLead.nome, conversaId: novaConversa.id },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}, ['ADMIN']);
