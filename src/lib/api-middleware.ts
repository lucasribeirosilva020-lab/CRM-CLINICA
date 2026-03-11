import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export type AuthUser = {
    id: string; // Adicionado id como principal
    userId: string;
    clinicaId: string;
    perfil: 'ADMIN' | 'VENDEDOR' | 'ATENDENTE';
    email: string;
};

export function withAuth(
    handler: (req: NextRequest, user: AuthUser, context: any) => Promise<NextResponse>,
    requiredPerfil?: ('ADMIN' | 'VENDEDOR' | 'ATENDENTE')[]
) {
    return async (req: NextRequest, context: any) => {
        // Tenta pegar token do header (Authorization: Bearer ...) OU do cookie
        const authHeader = req.headers.get('authorization');
        const cookieToken = req.cookies.get('access_token')?.value;
        const token = authHeader?.replace('Bearer ', '') || cookieToken;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const payload = await verifyAccessToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
        }

        const user = payload as AuthUser;
        if (!user.id && user.userId) user.id = user.userId;

        if (requiredPerfil && !requiredPerfil.includes(user.perfil)) {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
        }

        return handler(req, user, context);
    };
}

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}
