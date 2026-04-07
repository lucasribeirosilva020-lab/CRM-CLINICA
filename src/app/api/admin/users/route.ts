import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';
import bcrypt from 'bcryptjs';

// GET: Listar usuários da clínica
export const GET = withAuth(async (req: NextRequest, user: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { data: usuarios, error: supError } = await supabaseAdmin
            .from('Usuario')
            .select('id, nome, email, perfil, ativo, createdAt, avatar')
            .eq('clinicaId', user.clinicaId)
            .order('nome', { ascending: true });

        if (supError) throw supError;

        return NextResponse.json({ success: true, data: usuarios });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// POST: Criar novo usuário na clínica
export const POST = withAuth(async (req: NextRequest, user: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { nome, email, senha, perfil } = await req.json();

        if (!nome || !email || !senha || !perfil) {
            return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // Verifica se e-mail já existe
        const { data: existe } = await supabaseAdmin
            .from('Usuario')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (existe) {
            return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 });
        }

        const hashedSenha = await bcrypt.hash(senha, 10);
        const nowDate = new Date().toISOString();

        const { data: novoUsuario, error: iError } = await supabaseAdmin
            .from('Usuario')
            .insert({
                id: crypto.randomUUID(),
                nome,
                email: email.toLowerCase(),
                senha: hashedSenha,
                perfil,
                clinicaId: user.clinicaId,
                createdAt: nowDate,
                updatedAt: nowDate
            })
            .select('id, nome, email, perfil, ativo')
            .single();

        if (iError) throw iError;

        return NextResponse.json({ success: true, data: novoUsuario });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

