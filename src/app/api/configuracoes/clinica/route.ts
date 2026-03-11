import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';

export const GET = withAuth(async (req, { user }: any) => {
    try {
        const clinicaId = user.clinicaId;

        const clinica = await prisma.clinica.findUnique({
            where: { id: clinicaId },
            include: { configuracoes: true }
        });

        if (!clinica) {
            return NextResponse.json({ success: false, error: 'Clínica não encontrada' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                nome: clinica.nome,
                configuracoes: clinica.configuracoes || {
                    slaMinutos: 60,
                    diasInatividade: 30
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar configurações da clínica:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
});

export const PUT = withAuth(async (req, { user }: any) => {
    try {
        const clinicaId = user.clinicaId;
        const { nome, slaMinutos, diasInatividade } = await req.json();

        // Só ADMIN pode editar nome da clínica? Geralmente sim.
        // Mas vamos permitir por enquanto se tiver o clinicaId correto.

        await prisma.$transaction([
            prisma.clinica.update({
                where: { id: clinicaId },
                data: { nome }
            }),
            prisma.configuracaoClinica.upsert({
                where: { clinicaId },
                create: {
                    clinicaId,
                    slaMinutos: Number(slaMinutos),
                    diasInatividade: Number(diasInatividade)
                },
                update: {
                    slaMinutos: Number(slaMinutos),
                    diasInatividade: Number(diasInatividade)
                }
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar configurações da clínica:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
});
