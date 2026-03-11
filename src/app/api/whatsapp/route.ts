import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const evoHeaders = {
    'apikey': EVOLUTION_KEY,
    'Content-Type': 'application/json',
};

// GET - Verifica status da instância
export const GET = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const instanceName = `clinica-${clinicaId}`;

    try {
        const res = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instanceName}`, {
            headers: evoHeaders,
        });
        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// POST - Cria instância e retorna QR Code
export const POST = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const instanceName = `clinica-${clinicaId}`;

    try {
        // Passo 1: tenta deletar instância antiga (ignora se não existir)
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: evoHeaders,
        }).catch(() => { });

        // Passo 2: cria nova instância com payload mínimo
        const createRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
            method: 'POST',
            headers: evoHeaders,
            body: JSON.stringify({
                instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            }),
        });

        const createData = await createRes.json();
        console.log('[WHATSAPP CREATE] Status:', createRes.status);
        console.log('[WHATSAPP CREATE] Response:', JSON.stringify(createData).slice(0, 500));

        if (!createRes.ok) {
            return NextResponse.json({
                success: false,
                error: `Erro ao criar instância: ${createRes.status} - ${JSON.stringify(createData)}`,
            }, { status: 502 });
        }

        // Extrai o QR Code base64 — pode estar em vários lugares dependendo da versão
        const qrBase64 =
            createData?.qrcode?.base64 ||
            createData?.Qrcode?.base64 ||
            createData?.hash?.qrcode?.base64 ||
            createData?.qr?.base64 ||
            createData?.base64;

        // Se não veio QR no create, tenta buscar via /connect
        if (!qrBase64) {
            await new Promise(r => setTimeout(r, 1500)); // pequena espera para instância inicializar
            const connectRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
                headers: evoHeaders,
            });
            const connectData = await connectRes.json();
            console.log('[WHATSAPP CONNECT] Response:', JSON.stringify(connectData).slice(0, 300));

            const qrFromConnect =
                connectData?.base64 ||
                connectData?.qrcode?.base64 ||
                connectData?.code;

            return NextResponse.json({
                success: true,
                data: { qrBase64: qrFromConnect, raw: connectData }
            });
        }

        return NextResponse.json({
            success: true,
            data: { qrBase64, raw: createData }
        });

    } catch (error: any) {
        console.error('[WHATSAPP] Erro:', error.message);
        return NextResponse.json({
            success: false,
            error: `Falha ao conectar à Evolution API: ${error.message}`,
        }, { status: 500 });
    }
});

// DELETE - Remove instância
export const DELETE = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const instanceName = `clinica-${clinicaId}`;

    try {
        await fetch(`${EVOLUTION_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: evoHeaders,
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
