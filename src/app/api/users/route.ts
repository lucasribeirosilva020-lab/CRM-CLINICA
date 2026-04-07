import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        const { data: usuarios, error: supError } = await supabaseAdmin
            .from('Usuario')
            .select('id, nome, email, perfil, ativo, avatar')
            .eq('clinicaId', user.clinicaId)
            .eq('ativo', true)
            .order('nome', { ascending: true });

        if (supError) throw supError;

        return NextResponse.json({ success: true, data: usuarios });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
