import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

        // O slug não é alterado, apenas nome visual e cor. 
        // Os cards estão linkados pelo slug, então manter o slug não quebra as ligações.
        const atualizada = await prisma.kanbanColuna.update({
            where: {
                id,
                clinicaId // Garantir segurança do tenant
            },
            data: { nome, cor }
        });

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
        // Primeiro busca a coluna para descobrir o seu slug e seu tipo
        const coluna = await prisma.kanbanColuna.findUnique({
            where: { id, clinicaId }
        });

        if (!coluna) {
            return NextResponse.json({ success: false, error: 'Coluna não encontrada' }, { status: 404 });
        }

        // Verifica se existem conversas associadas a este slug neste kanban
        const campoStatus = coluna.tipo === 'ATENDIMENTO' ? 'kanbanAtenStat' : 'kanbanVendStat';

        const cardsAgregados = await prisma.conversa.count({
            where: {
                clinicaId,
                [campoStatus]: coluna.slug,
                encerrada: false // Podemos ou não verificar conversas ativas.
            }
        });

        if (cardsAgregados > 0) {
            return NextResponse.json({
                success: false,
                error: `Esta coluna não pode ser excluída pois possui ${cardsAgregados} card(s). Movimente-os antes de excluir.`
            }, { status: 400 });
        }

        // Exclui a coluna
        await prisma.kanbanColuna.delete({
            where: { id, clinicaId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[KANBAN COLUNA DELETE]', error);
        return NextResponse.json({ success: false, error: 'Erro ao excluir coluna' }, { status: 500 });
    }
});
