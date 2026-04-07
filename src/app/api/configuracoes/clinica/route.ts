import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

export const GET = withAuth(async (req: NextRequest, { user }: any) => {
    try {
        const clinicaId = user.clinicaId;

        const { data: clinica, error: cError } = await supabaseAdmin
            .from('Clinica')
            .select('nome, configuracoes:ConfiguracaoClinica(*)')
            .eq('id', clinicaId)
            .single();

        if (cError || !clinica) {
            return NextResponse.json({ success: false, error: 'Clínica não encontrada' }, { status: 404 });
        }

        const config = (clinica.configuracoes as any)?.[0];

        return NextResponse.json({
            success: true,
            data: {
                nome: clinica.nome,
                configuracoes: config || {
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

export const PUT = withAuth(async (req: NextRequest, { user }: any) => {
    try {
        const clinicaId = user.clinicaId;
        const { nome, slaMinutos, diasInatividade } = await req.json();
        const nowDate = new Date().toISOString();

        // 1. Atualiza nome da clínica
        const { error: u1Error } = await supabaseAdmin
            .from('Clinica')
            .update({ nome, updatedAt: nowDate })
            .eq('id', clinicaId);

        if (u1Error) throw u1Error;

        // 2. Upsert configurações
        const { error: u2Error } = await supabaseAdmin
            .from('ConfiguracaoClinica')
            .upsert({
                clinicaId,
                slaMinutos: Number(slaMinutos),
                diasInatividade: Number(diasInatividade),
                updatedAt: nowDate
            }, { onConflict: 'clinicaId' });

        if (u2Error) throw u2Error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar configurações da clínica:', error);
        return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
    }
});

