import { SignJWT, jwtVerify } from 'jose';

function getSecrets() {
    const secret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    
    if (!secret || !refreshSecret) {
        console.warn('[JWT] Warning: JWT_SECRET or JWT_REFRESH_SECRET is missing');
        return null;
    }

    return {
        secret: new TextEncoder().encode(secret),
        refreshSecret: new TextEncoder().encode(refreshSecret)
    };
}

export interface JWTPayload {
    userId: string;
    clinicaId: string;
    perfil: 'ADMIN' | 'VENDEDOR' | 'ATENDENTE';
    email: string;
    [key: string]: any;
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
    const s = getSecrets();
    if (!s) throw new Error('JWT Secrets missing');
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(s.secret);
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
    const s = getSecrets();
    if (!s) throw new Error('JWT Secrets missing');
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(s.refreshSecret);
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
        const s = getSecrets();
        if (!s) return null;
        const { payload } = await jwtVerify(token, s.secret);
        return payload as JWTPayload;
    } catch {
        return null;
    }
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
    try {
        const s = getSecrets();
        if (!s) return null;
        const { payload } = await jwtVerify(token, s.refreshSecret);
        return payload as JWTPayload;
    } catch {
        return null;
    }
}
