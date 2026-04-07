import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

// PUT - Atualiza uma coluna existente (Nome e Cor)
export const PUT = withAuth(async (req: NextRequest, user: any, context: any) => {
    const clinicaId = user.clinicaId;
    const { id } = context.params;

    if (user.perfil !== 'ADMIN') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { nome, cor } = body;

        const { data: atualizada, error: uError } = await supabaseAdmin
            .from('KanbanColuna')
            .update({ nome, cor, updatedAt: new Date().toISOString() })
            .eq('id', id)
            .eq('clinicaId', clinicaId)
            .select()
            .single();

        if (uError) throw uError;

        return NextResponse.json({ success: true, data: atualizada });
    } catch (error: any) {
        console.error('[KANBAN COLUNA PUT]', error);
        return NextResponse.json({ success: false, error: 'Erro ao atualizar coluna' }, { status: 500 });
    }
});

// DELETE - Exclui uma coluna
export const DELETE = withAuth(async (req: NextRequest, user: any, context: any) => {
    const clinicaId = user.clinicaId;
    const { id } = context.params;

    if (user.perfil !== 'ADMIN') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    try {
        // 1. Busca a coluna para descobrir o seu slug e seu tipo
        const { data: coluna, error: fError } = await supabaseAdmin
            .from('KanbanColuna')
            .select('slug, tipo')
            .eq('id', id)
            .eq('clinicaId', clinicaId)
            .single();

        if (fError || !coluna) {
            return NextResponse.json({ success: false, error: 'Coluna não encontrada' }, { status: 404 });
        }

        // 2. Verifica se existem conversas associadas a este slug neste kanban
        const campoStatus = (coluna as any).tipo === 'ATENDIMENTO' ? 'kanbanAtenStat' : 'kanbanVendStat';

        const { count, error: cError } = await supabaseAdmin
            .from('Conversa')
            .select('*', { count: 'exact', head: true })
            .eq('clinicaId', clinicaId)
            .eq(campoStatus, (coluna as any).slug);

        if (cError) throw cError;

        if (count && count > 0) {
            return NextResponse.json({
                success: false,
                error: `Esta coluna não pode ser excluída pois possui ${count} card(s). Movimente-os antes de excluir.`
            }, { status: 400 });
        }

        // 3. Exclui a coluna
        const { error: dError } = await supabaseAdmin
            .from('KanbanColuna')
            .delete()
            .eq('id', id)
            .eq('clinicaId', clinicaId);

        if (dError) throw dError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[KANBAN COLUNA DELETE]', error);
        return NextResponse.json({ success: false, error: 'Erro ao excluir coluna' }, { status: 500 });
    }
});

