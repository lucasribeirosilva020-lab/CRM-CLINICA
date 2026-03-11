import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';

const PUBLIC_PATHS = ['/login', '/signup', '/api/auth/signup', '/api/auth/login', '/api/auth/refresh', '/api/webhook'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Permite rotas públicas e webhooks externos
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Permite assets estáticos
    if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // --- Tenta o access token primeiro ---
    if (accessToken) {
        const payload = await verifyAccessToken(accessToken);
        if (payload) {
            return NextResponse.next(); // Token válido, segue normalmente
        }
    }

    // --- Access token expirado/ausente: tenta renovar com refresh token ---
    if (refreshToken) {
        const payload = await verifyRefreshToken(refreshToken);
        if (payload) {
            // Gera novos tokens
            const newAccessToken = await signAccessToken({
                userId: (payload as any).userId,
                clinicaId: (payload as any).clinicaId,
                perfil: (payload as any).perfil,
                email: (payload as any).email,
            });
            const newRefreshToken = await signRefreshToken({
                userId: (payload as any).userId,
                clinicaId: (payload as any).clinicaId,
                perfil: (payload as any).perfil,
                email: (payload as any).email,
            });

            // Continua a requisição original com o novo access token
            const response = NextResponse.next();

            // Salva os novos tokens nos cookies
            response.cookies.set('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 dias
            });
            response.cookies.set('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 dias
            });

            return response;
        }
    }

    // --- Sem tokens válidos: redireciona para login ---
    if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
