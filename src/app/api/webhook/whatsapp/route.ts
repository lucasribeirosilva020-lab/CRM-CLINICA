import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Webhook para receber eventos da Evolution API
 * 
 * A Evolution vai chamar esta URL em POST a cada mensagem recebida/enviada.
 * URL configurada: NEXT_PUBLIC_APP_URL/api/webhook/whatsapp
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { event, instance, data } = body;

        console.log('[WEBHOOK]', event, instance);

        // Extrai o clinicaId da instância (formato: "clinica-{clinicaId}")
        const clinicaId = instance?.replace('clinica-', '');
        if (!clinicaId) return NextResponse.json({ ok: true });

        // === MENSAGEM RECEBIDA ===
        if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
            for (const msg of data?.messages || []) {
                // Ignora mensagens enviadas pelo próprio bot/sistema
                if (msg.key?.fromMe) continue;

                const telefone = msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
                const conteudo = msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    '[Mídia recebida]';

                if (!telefone || !conteudo) continue;

                // Busca ou cria o lead pelo telefone
                let lead = await prisma.lead.findFirst({
                    where: { clinicaId, telefone },
                    include: { conversa: true }
                });

                if (!lead) {
                    const nome = msg.pushName || telefone;
                    lead = await prisma.lead.create({
                        data: {
                            clinicaId,
                            nome,
                            telefone,
                            tags: '[]',
                        },
                        include: { conversa: true }
                    });
                }

                // Busca ou cria conversa
                let conversa = lead.conversa;
                if (!conversa) {
                    conversa = await prisma.conversa.create({
                        data: {
                            clinicaId,
                            leadId: lead.id,
                            kanbanAtenStat: 'fila_espera',
                        }
                    });
                }

                // Salva a mensagem
                await prisma.mensagem.create({
                    data: {
                        clinicaId,
                        conversaId: conversa.id,
                        conteudo,
                        tipo: 'TEXTO',
                        de: telefone,
                        lida: false,
                    }
                });

                // Atualiza resumo da conversa
                await prisma.conversa.update({
                    where: { id: conversa.id },
                    data: {
                        ultimaMensagem: conteudo,
                        ultimaMensagemAt: new Date(),
                        naoLidas: { increment: 1 },
                    }
                });
            }
        }

        // === STATUS DE CONEXÃO ===
        if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
            const conectado = data?.state === 'open';
            await prisma.configuracaoClinica.upsert({
                where: { clinicaId },
                create: { clinicaId, whatsappConectado: conectado },
                update: { whatsappConectado: conectado }
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

// A Evolution também faz GET para validar o webhook
export async function GET() {
    return NextResponse.json({ status: 'webhook ativo' });
}
