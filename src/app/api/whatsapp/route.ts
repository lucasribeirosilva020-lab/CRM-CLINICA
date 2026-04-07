import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { supabaseAdmin } from '@/lib/supabase-admin';
import * as uazapi from '@/lib/uazapi';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// GET - Verifica status da instância e configurações
export const GET = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    
    try {
        const [clinicaRes, configRes] = await Promise.all([
            supabaseAdmin.from('Clinica').select('slug').eq('id', clinicaId).single(),
            supabaseAdmin.from('ConfiguracaoClinica').select('*').eq('clinicaId', clinicaId).single()
        ]);
        
        const clinica = clinicaRes.data;
        const config = configRes.data;
        
        const instanceName = clinica?.slug || `clinica-${clinicaId}`;
        
        // Se estiver em modo n8n, o status é apenas o que temos no banco
        if (config?.whatsappModo === 'n8n') {
            return NextResponse.json({ 
                success: true, 
                data: { 
                    status: config.whatsappConectado ? 'connected' : 'disconnected',
                    config
                } 
            });
        }

        const uazapiStatus = await uazapi.statusInstancia(instanceName, config?.whatsappSessao || undefined);
        return NextResponse.json({ success: true, data: { ...uazapiStatus, config } });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// PUT - Atualiza configurações de integração
export const PUT = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    try {
        const body = await req.json();
        const { whatsappModo, webhookN8nUrl, whatsappConectado } = body;
        

        if (!clinicaId) {
            return NextResponse.json({ success: false, error: 'Clínica não identificada' }, { status: 401 });
        }

        const { data: existing } = await supabaseAdmin
            .from('ConfiguracaoClinica')
            .select('id')
            .eq('clinicaId', clinicaId)
            .maybeSingle();

        const updateData: any = {
            id: existing?.id || crypto.randomUUID(),
            clinicaId,
            updatedAt: new Date().toISOString()
        };

        if (whatsappModo !== undefined) updateData.whatsappModo = whatsappModo;
        if (webhookN8nUrl !== undefined) updateData.webhookN8nUrl = webhookN8nUrl;
        if (whatsappConectado !== undefined) updateData.whatsappConectado = !!whatsappConectado;

        const { data: config, error: uError } = await supabaseAdmin
            .from('ConfiguracaoClinica')
            .upsert(updateData, { onConflict: 'clinicaId' })
            .select();

        if (uError) {
            return NextResponse.json({ success: false, error: uError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: config?.[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// POST - Cria instância e retorna QR Code
export const POST = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const webhookUrl = `${APP_URL}/api/webhook/whatsapp`;

    try {
        const [clinicaRes, configRes] = await Promise.all([
            supabaseAdmin.from('Clinica').select('slug, nome').eq('id', clinicaId).single(),
            supabaseAdmin.from('ConfiguracaoClinica').select('whatsappSessao').eq('clinicaId', clinicaId).single()
        ]);

        const clinica = clinicaRes.data;
        const config = configRes.data;

        const instanceName = clinica?.slug || uazapi.sanitizarNomeInstancia(clinica?.nome || `clinica-${clinicaId}`);
        let currentToken = config?.whatsappSessao || undefined;

        console.log(`[UAZAPI] Gerenciando instância: ${instanceName}`);

        // 1. Verifica se a instância atual é válida
        let status = await uazapi.statusInstancia(instanceName, currentToken);
        
        // 2. Se a instância não existe ou o token expirou (401/404), recriamos
        if (status.error && (status.status === 401 || status.status === 404)) {
            console.log(`[UAZAPI] Instância inválida ou expirada (${status.status}). Recriando...`);
            const createRes = await uazapi.criarInstancia(instanceName);
            
            if (createRes.error) {
                return NextResponse.json({ success: false, error: createRes.error }, { status: 502 });
            }

            // Atualiza o token local e no banco
            currentToken = createRes.token || createRes.instance?.token;
            if (currentToken) {
                await supabaseAdmin
                    .from('ConfiguracaoClinica')
                    .upsert({ 
                        clinicaId, 
                        whatsappSessao: currentToken,
                        updatedAt: new Date().toISOString()
                    }, { onConflict: 'clinicaId' });
            }
        }

        // 3. Define o Webhook (Sempre garante que esteja configurado)
        await uazapi.definirWebhook(instanceName, webhookUrl, currentToken);

        // 4. Obtém o QR Code
        const qrRes = await uazapi.obterQrCode(instanceName, currentToken);
        
        if (qrRes.error) {
            // Se já estiver conectado, retornamos o status de sucesso
            const currentStatus = await uazapi.statusInstancia(instanceName, currentToken);
            if (currentStatus.instance?.status === 'connected' || currentStatus.status?.connected) {
                return NextResponse.json({
                    success: true,
                    data: { status: 'connected', message: 'Já conectado' }
                });
            }
            return NextResponse.json({ success: false, error: qrRes.error }, { status: 502 });
        }

        if (!qrRes.base64 && !qrRes.qrcode) {
            return NextResponse.json({ success: false, error: 'QR Code não retornado pela API' }, { status: 502 });
        }

        const qrBase64 = qrRes.base64 || qrRes.qrcode;

        return NextResponse.json({
            success: true,
            data: { qrBase64, raw: qrRes }
        });

    } catch (error: any) {
        console.error('[UAZAPI] Erro:', error.message);
        return NextResponse.json({
            success: false,
            error: `Falha ao conectar à Uazapi: ${error.message}`,
        }, { status: 500 });
    }
});

// DELETE - Remove instância
export const DELETE = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const { data: clinica } = await supabaseAdmin.from('Clinica').select('slug').eq('id', clinicaId).single();
    const instanceName = clinica?.slug || `clinica-${clinicaId}`;

    try {
        await uazapi.deletarInstancia(instanceName);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

