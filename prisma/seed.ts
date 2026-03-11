import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar clínica padrão
    const clinica = await prisma.clinica.upsert({
        where: { slug: 'clinica-demo' },
        update: {},
        create: {
            nome: 'CRM Clínica',
            slug: 'clinica-demo',
            configuracoes: {
                create: {
                    diasInatividade: 30,
                    slaMinutos: 60,
                },
            },
        },
    });

    console.log('✅ Clínica criada:', clinica.nome);

    // Usuários padrão
    const usuarios = [
        {
            nome: 'Admin Sistema',
            email: 'admin@crm.com',
            senha: 'admin123',
            perfil: 'ADMIN',
        },
        {
            nome: 'Carlos Vendedor',
            email: 'vendedor@crm.com',
            senha: 'vendedor123',
            perfil: 'VENDEDOR',
        },
        {
            nome: 'Ana Atendente',
            email: 'atendente@crm.com',
            senha: 'atendente123',
            perfil: 'ATENDENTE',
        },
    ];

    for (const u of usuarios) {
        const hash = await bcrypt.hash(u.senha, 10);
        await prisma.usuario.upsert({
            where: { clinicaId_email: { clinicaId: clinica.id, email: u.email } },
            update: {},
            create: {
                clinicaId: clinica.id,
                nome: u.nome,
                email: u.email,
                senha: hash,
                perfil: u.perfil,
            },
        });
        console.log(`✅ Usuário criado: ${u.nome} (${u.perfil}) — ${u.email} / ${u.senha}`);
    }

    // Colunas padrão do Kanban — Atendimento
    const colunasAtendimento = [
        { nome: 'Fila de Espera', slug: 'fila_espera', cor: '#6B7280', ordem: 0 },
        { nome: 'Em Atendimento', slug: 'em_atendimento', cor: '#1A73E8', ordem: 1 },
        { nome: 'Qualificado', slug: 'qualificado', cor: '#FBBC04', ordem: 2 },
        { nome: 'Encerrado', slug: 'encerrado', cor: '#34A853', ordem: 3 },
    ];

    for (const col of colunasAtendimento) {
        await prisma.kanbanColuna.upsert({
            where: { clinicaId_tipo_slug: { clinicaId: clinica.id, tipo: 'ATENDIMENTO', slug: col.slug } },
            update: {},
            create: { clinicaId: clinica.id, tipo: 'ATENDIMENTO', ...col },
        });
    }

    // Colunas padrão do Kanban — Vendas
    const colunasVendas = [
        { nome: 'Novo Lead', slug: 'novo_lead', cor: '#9CA3AF', ordem: 0 },
        { nome: 'Proposta Enviada', slug: 'proposta_enviada', cor: '#1A73E8', ordem: 1 },
        { nome: 'Negociação', slug: 'negociacao', cor: '#FBBC04', ordem: 2 },
        { nome: 'Ganho', slug: 'ganho', cor: '#34A853', ordem: 3 },
        { nome: 'Perdido', slug: 'perdido', cor: '#EA4335', ordem: 4 },
    ];

    for (const col of colunasVendas) {
        await prisma.kanbanColuna.upsert({
            where: { clinicaId_tipo_slug: { clinicaId: clinica.id, tipo: 'VENDAS', slug: col.slug } },
            update: {},
            create: { clinicaId: clinica.id, tipo: 'VENDAS', ...col },
        });
    }

    console.log('✅ Colunas do Kanban criadas');

    // Leads e conversas de exemplo
    const leadsExemplo = [
        { nome: 'Julia Pereira', telefone: '5548991234567' },
        { nome: 'Roberto Almeida', telefone: '5548992345678' },
        { nome: 'Carla Santos', telefone: '5548993456789' },
        { nome: 'Marcos Oliveira', telefone: '5548994567890' },
        { nome: 'Fernanda Costa', telefone: '5548995678901' },
    ];

    const atendente = await prisma.usuario.findFirst({
        where: { clinicaId: clinica.id, perfil: 'ATENDENTE' },
    });

    for (const lead of leadsExemplo) {
        const l = await prisma.lead.upsert({
            where: { clinicaId_telefone: { clinicaId: clinica.id, telefone: lead.telefone } },
            update: {},
            create: { clinicaId: clinica.id, nome: lead.nome, telefone: lead.telefone },
        });

        await prisma.conversa.upsert({
            where: { leadId: l.id },
            update: {},
            create: {
                clinicaId: clinica.id,
                leadId: l.id,
                atendenteId: atendente?.id,
                kanbanAtenStat: 'fila_espera',
                ultimaMensagem: 'Olá, gostaria de saber mais sobre os atendimentos.',
                ultimaMensagemAt: new Date(Date.now() - Math.random() * 3600000),
                naoLidas: Math.floor(Math.random() * 5),
            },
        });
    }

    console.log('✅ Leads e conversas de exemplo criados');
    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('   👑 Admin:     admin@crm.com     / admin123');
    console.log('   💼 Vendedor:  vendedor@crm.com  / vendedor123');
    console.log('   🎧 Atendente: atendente@crm.com / atendente123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
