import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

export const POST = withAuth(async (req: NextRequest, { user }: any) => {
    try {
        const { valorMeta, metasIndividuais } = await req.json();
        const clinicaId = user.clinicaId;
        const agora = new Date();
        const mes = agora.getMonth() + 1;
        const ano = agora.getFullYear();

        const metasData: { clinicaId: string, mes: number, ano: number, valorMeta: number, vendedorId: string | null, updatedAt: string }[] = [
            { clinicaId, mes, ano, valorMeta, vendedorId: null, updatedAt: agora.toISOString() }
        ];

        if (metasIndividuais && Array.isArray(metasIndividuais)) {
            metasIndividuais.forEach((m: { vendedorId: string, valorMeta: number }) => {
                metasData.push({
                    clinicaId, mes, ano,
                    vendedorId: m.vendedorId,
                    valorMeta: m.valorMeta,
                    updatedAt: agora.toISOString()
                });
            });
        }

        const { error: upsertError } = await supabaseAdmin
            .from('Meta')
            .upsert(metasData, { onConflict: 'clinicaId,mes,ano,vendedorId' });

        if (upsertError) throw upsertError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Erro ao salvar meta:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

