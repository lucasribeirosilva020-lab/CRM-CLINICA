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
            kanbanAtenStat, kanbanVendStat
        } = body;

        const { data: updatedLead, error: uError } = await supabaseAdmin
            .from('Lead')
            .update({
                nome,
                telefone,
                email,
                tags: tags ? JSON.stringify(tags) : undefined,
                prioridade,
                valor,
                busca
            })
            .eq('id', leadId)
            .select()
            .single();

        if (uError) throw uError;

        if (kanbanAtenStat || kanbanVendStat) {
            const updateData: any = {};
            if (kanbanAtenStat) updateData.kanbanAtenStat = kanbanAtenStat;
            if (kanbanVendStat) updateData.kanbanVendStat = kanbanVendStat;

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
