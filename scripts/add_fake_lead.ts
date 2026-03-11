import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manualmente
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=:]+?)[=:](.*)/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/['"]/g, '');
            process.env[key] = value;
        }
    });
}


const prisma = new PrismaClient();

async function main() {
    // 1. Encontrar o usuário "Juju"
    const usuarioInfo = await prisma.usuario.findFirst({
        where: { nome: { contains: 'Juju', mode: 'insensitive' } }
    });

    if (!usuarioInfo) {
        console.error("Usuário Juju não encontrado. Vou tentar pegar o primeiro usuário disponível.");
    }

    const clinicaId = usuarioInfo?.clinicaId;

    if (!clinicaId) {
        const clinicaInfo = await prisma.clinica.findFirst();
        if (!clinicaInfo) throw new Error("Nenhuma clínica encontrada para atrelar o lead");

        await criarLead(clinicaInfo.id, usuarioInfo?.id);
    } else {
        await criarLead(clinicaId, usuarioInfo.id);
    }
}

async function criarLead(clinicaId: string, atendenteId?: string) {
    const telefoneFake = `551199999${Math.floor(Math.random() * 9000) + 1000}`;

    // Criar o Lead
    const lead = await prisma.lead.create({
        data: {
            clinicaId,
            nome: 'Paciente Teste Supabase',
            telefone: telefoneFake,
            prioridade: 'NORMAL',
            tags: '["Teste"]',
            conversa: {
                create: {
                    clinicaId,
                    atendenteId: atendenteId, // Atribuir à Juju se ela existir
                    kanbanAtenStat: 'fila_espera',
                    ultimaMensagem: 'Testando upload do Supabase!',
                    ultimaMensagemAt: new Date(),
                    mensagens: {
                        create: [
                            {
                                clinicaId,
                                conteudo: 'Olá! Sou um paciente de teste.',
                                de: telefoneFake,
                                tipo: 'TEXTO'
                            }
                        ]
                    }
                }
            }
        }
    });

    console.log(`✅ Lead fake criado com sucesso! Nome: ${lead.nome} | Telefone: ${lead.telefone}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
