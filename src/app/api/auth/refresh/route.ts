import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get('refresh_token')?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token não encontrado' }, { status: 401 });
        }

        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json({ error: 'Refresh token inválido ou expirado' }, { status: 401 });
        }

        const newAccessToken = await signAccessToken({
            userId: payload.userId,
            clinicaId: payload.clinicaId,
            perfil: payload.perfil,
            email: payload.email,
        });
        const newRefreshToken = await signRefreshToken({
            userId: payload.userId,
            clinicaId: payload.clinicaId,
            perfil: payload.perfil,
            email: payload.email,
        });

        const response = NextResponse.json({
            success: true,
            data: { accessToken: newAccessToken },
        });

        response.cookies.set('access_token', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60,
        });

        response.cookies.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;
    } catch (error) {
        console.error('[AUTH REFRESH]', error);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}
