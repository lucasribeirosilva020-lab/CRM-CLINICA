import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';

export const POST = withAuth(async (req, { user }: any) => {
    try {
        const { valorMeta } = await req.json();
        const clinicaId = user.clinicaId;
        const agora = new Date();
        const mes = agora.getMonth() + 1;
        const ano = agora.getFullYear();

        // Upsert para a meta global do mês (vendedorId: null)
        const metaDoc = await prisma.meta.findFirst({
            where: { clinicaId, mes, ano, vendedorId: null }
        });

        if (metaDoc) {
            await prisma.meta.update({
                where: { id: metaDoc.id },
                data: { valorMeta }
            });
        } else {
            await prisma.meta.create({
                data: {
                    clinicaId,
                    mes,
                    ano,
                    valorMeta,
                    vendedorId: null
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar meta:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
});
