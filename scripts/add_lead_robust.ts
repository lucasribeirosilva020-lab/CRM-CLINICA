import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const env: any = {};
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=:]+?)[=:](.*)/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
        }
    });
}

const dbUrl = env['DATABASE_URL'] || '';

async function main() {
    console.log(`Tentando conectar ao banco...`);

    const prisma = new PrismaClient({
        datasources: {
            db: { url: dbUrl }
        }
    });

    try {
        const clinicas = await prisma.clinica.findMany({
            include: { usuarios: true }
        });

        console.log('Clínicas encontradas:', clinicas.length);

        for (const clinica of clinicas) {
            console.log(`- Clínica: ${clinica.nome} (ID: ${clinica.id})`);
            const juju = clinica.usuarios.find(u => u.nome.toLowerCase().includes('juju'));

            // Criar lead em todas as clínicas ou na da Juju
            if (juju || clinicas.length === 1) {
                console.log(`>> Criando lead para clínica: ${clinica.nome}`);
                const telefoneFake = `551199999${Math.floor(Math.random() * 9000) + 1000}`;

                const lead = await prisma.lead.create({
                    data: {
                        clinicaId: clinica.id,
                        nome: 'Paciente Teste Supabase (Juju)',
                        telefone: telefoneFake,
                        tags: '["Teste"]',
                        conversa: {
                            create: {
                                clinicaId: clinica.id,
                                atendenteId: juju?.id,
                                kanbanAtenStat: 'fila_espera',
                                ultimaMensagem: 'Teste Supabase!',
                                ultimaMensagemAt: new Date(),
                                mensagens: {
                                    create: [{
                                        clinicaId: clinica.id,
                                        conteudo: 'Olá! Sou um paciente de teste para a Juju.',
                                        de: telefoneFake,
                                        tipo: 'TEXTO'
                                    }]
                                }
                            }
                        }
                    }
                });
                console.log(`✅ Lead '${lead.nome}' criado com sucesso!`);
            }
        }
    } catch (e: any) {
        console.error('Erro de conexão Prisma:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
