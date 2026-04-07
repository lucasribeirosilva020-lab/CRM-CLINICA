import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import bcrypt from 'bcryptjs';
import { signAccessToken, signRefreshToken } from '@/lib/jwt';

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const { email, senha } = await req.json();

        if (!email || !senha) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
        }

        if (!supabaseAdmin) {
            console.error('[AUTH LOGIN] supabaseAdmin is NULL. Check environment variables.');
            return NextResponse.json({ error: 'Erro de configuração: Chaves do banco de dados não encontradas no servidor.' }, { status: 500 });
        }

        const { data: usuario, error: supError } = await supabaseAdmin
            .from('Usuario')
            .select('*, clinica:Clinica(*)')
            .eq('email', email.toLowerCase())
            .eq('ativo', true)
            .single();

        if (supError || !usuario) {
            if (supError) console.error('[AUTH LOGIN] Erro Supabase:', supError);
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
        }

        const payload = {
            userId: usuario.id,
            clinicaId: usuario.clinicaId,
            perfil: usuario.perfil as 'ADMIN' | 'VENDEDOR' | 'ATENDENTE',
            email: usuario.email,
        };

        console.log('[AUTH LOGIN] Gerando tokens para:', payload.email);
        const accessToken = await signAccessToken(payload);
        const refreshToken = await signRefreshToken(payload);

        const response = NextResponse.json({
            success: true,
            data: {
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    perfil: usuario.perfil,
                    avatar: usuario.avatar,
                    clinica: { id: usuario.clinica.id, nome: usuario.clinica.nome },
                },
                accessToken,
            },
        });

        // Cookie seguro para o access token
        response.cookies.set('access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60, // 15 minutos
        });

        response.cookies.set('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 dias
        });

        return response;
    } catch (error: any) {
        console.error('[AUTH LOGIN] CRITICAL ERROR:', {
            message: error.message,
            stack: error.stack,
            env: {
                hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasJwtSecret: !!process.env.JWT_SECRET
            }
        });
        return NextResponse.json({ error: `Erro interno: ${error.message || 'desconhecido'}` }, { status: 500 });
    }
}
