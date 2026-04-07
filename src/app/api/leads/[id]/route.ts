import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

export const PUT = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;
        const body = await req.json();

        const { data: lead, error: gError } = await supabaseAdmin
            .from('Lead')
            .select('*, conversa:Conversa(*)')
            .eq('id', leadId)
            .eq('clinicaId', clinicaId)
            .single();

        if (gError || !lead) {
            return NextResponse.json({ success: false, error: 'Lead não encontrado' }, { status: 404 });
        }

        // Campos permitidos para atualização
        const {
            nome, telefone, email, tags, prioridade, valor, busca,
            kanbanAtenStat, kanbanVendStat, atribuidoA, naoLidas
        } = body;

        const updatePayload: any = {};
        let updatedLead: any = lead;
        
        if (nome !== undefined) updatePayload.nome = nome;
        if (telefone !== undefined) updatePayload.telefone = telefone;
        if (email !== undefined) updatePayload.email = email;
        if (tags !== undefined) updatePayload.tags = tags ? JSON.stringify(tags) : null;
        if (prioridade !== undefined) updatePayload.prioridade = prioridade;
        if (valor !== undefined) updatePayload.valor = valor;
        if (busca !== undefined) updatePayload.busca = busca;

        if (Object.keys(updatePayload).length > 0) {
            const { data, error: uError } = await supabaseAdmin
                .from('Lead')
                .update(updatePayload)
                .eq('id', leadId)
                .select()
                .single();

            if (uError) throw uError;
            if (data) updatedLead = data;
        }

        if (kanbanAtenStat || kanbanVendStat || atribuidoA !== undefined || naoLidas !== undefined) {
            const updateData: any = {};
            if (kanbanAtenStat) updateData.kanbanAtenStat = kanbanAtenStat;
            if (kanbanVendStat) updateData.kanbanVendStat = kanbanVendStat;
            if (atribuidoA !== undefined) updateData.atendenteId = atribuidoA || null;
            if (naoLidas !== undefined) updateData.naoLidas = naoLidas;

            const { error: cError } = await supabaseAdmin
                .from('Conversa')
                .update(updateData)
                .eq('leadId', leadId);

            if (cError) throw cError;
        }

        return NextResponse.json({ success: true, data: updatedLead });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

export const DELETE = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        const { id: leadId } = context.params;
        const { clinicaId } = user;

        // 1. Deletar Conversa e dependências
        const { data: conversa } = await supabaseAdmin
            .from('Conversa')
            .select('id')
            .eq('leadId', leadId)
            .single();

        if (conversa) {
            // Deletar Transferencias vinculadas à conversa
            await supabaseAdmin.from('Transferencia').delete().eq('conversaId', conversa.id);
            // Deletar Mensagens vinculadas à conversa
            await supabaseAdmin.from('Mensagem').delete().eq('conversaId', conversa.id);
            // Deletar Agendamentos vinculados à conversa
            await supabaseAdmin.from('MensagemAgendada').delete().eq('conversaId', conversa.id);
            // Deletar a Conversa
            await supabaseAdmin.from('Conversa').delete().eq('id', conversa.id);
        }

        // 2. Deletar dependência de Cliente (se existir)
        // Nota: Podemos optar por deletar o cliente ou apenas remover o vínculo.
        // Como o usuário quer excluir lead OU cliente, se o lead for deletado, faz sentido remover o cliente associado se não houver mais utilidade.
        await supabaseAdmin.from('Cliente').delete().eq('leadId', leadId);

        // 3. Deletar o Lead
        const { error: lError } = await supabaseAdmin
            .from('Lead')
            .delete()
            .eq('id', leadId)
            .eq('clinicaId', clinicaId);

        if (lError) throw lError;

        return NextResponse.json({ success: true, message: 'Lead e dados associados excluídos com sucesso' });
    } catch (error: any) {
        console.error('[DELETE LEAD] Erro:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
