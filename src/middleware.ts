import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';

const PUBLIC_PATHS = [
    '/login',
    '/signup',
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/webhook',
    '/favicon.ico',
    '/manifest.json',
    '/icon-'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.includes('.')) {
        return NextResponse.next();
    }

    // Permite rotas públicas e assets essenciais
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // console.log(`[Middleware] Path: ${pathname} | Auth: ${!!accessToken ? 'Access' : 'None'}`);

    if (accessToken) {
        try {
            const payload = await verifyAccessToken(accessToken);
            if (payload) {
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set('x-user-data', JSON.stringify(payload));
                return NextResponse.next({
                    request: { headers: requestHeaders }
                });
            }
        } catch (e) {
            console.error('[Middleware] Verify error:', e);
        }
    }

    if (refreshToken) {
        try {
            const payload = await verifyRefreshToken(refreshToken);
            if (payload) {
                const p = {
                    userId: (payload as any).userId,
                    id: (payload as any).id || (payload as any).userId,
                    clinicaId: (payload as any).clinicaId,
                    perfil: (payload as any).perfil,
                    email: (payload as any).email,
                };
                const newAccessToken = await signAccessToken(p);
                const newRefreshToken = await signRefreshToken(p);

                const requestHeaders = new Headers(request.headers);
                requestHeaders.set('x-user-data', JSON.stringify(p));

                const response = NextResponse.next({
                    request: { headers: requestHeaders }
                });

                response.cookies.set('access_token', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 7,
                });
                response.cookies.set('refresh_token', newRefreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30,
                });
                return response;
            }
        } catch (e) {
            console.error('[Middleware] Refresh error:', e);
        }
    }

    // Se estiver em uma rota de API e não autenticado
    if (pathname.startsWith('/api/')) {

        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Redireciona para login
    // console.log(`[Middleware] Redirecting to /login from ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/refresh).*)'],
};
