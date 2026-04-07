import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';
import bcrypt from 'bcryptjs';

// PATCH: Atualizar usuário (Nome, Perfil, Ativo, Senha)
export const PATCH = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = context.params;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
        }

        const { nome, perfil, ativo, senha } = await req.json();

        const updateData: any = { updatedAt: new Date().toISOString() };
        if (nome !== undefined) updateData.nome = nome;
        if (perfil !== undefined) updateData.perfil = perfil;
        if (ativo !== undefined) updateData.ativo = ativo;
        if (senha) {
            updateData.senha = await bcrypt.hash(senha, 10);
        }

        const { data: atualizado, error: uError } = await supabaseAdmin
            .from('Usuario')
            .update(updateData)
            .eq('id', id)
            .eq('clinicaId', user.clinicaId)
            .select('id, nome, email, perfil, ativo')
            .single();

        if (uError) throw uError;

        return NextResponse.json({ success: true, data: atualizado });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// DELETE: Remover usuário
export const DELETE = withAuth(async (req: NextRequest, user: any, context: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { id } = context.params;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
        }

        const { error: dError } = await supabaseAdmin
            .from('Usuario')
            .delete()
            .eq('id', id)
            .eq('clinicaId', user.clinicaId);

        if (dError) throw dError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

