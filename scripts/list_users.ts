import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const usuarios = await prisma.usuario.findMany({
        include: { clinica: true }
    });
    console.log('--- Usuários no Banco ---');
    usuarios.forEach(u => {
        console.log(`ID: ${u.id} | Nome: ${u.nome} | Clínica: ${u.clinica.nome} (${u.clinica.id})`);
    });
}

main().finally(() => prisma.$disconnect());
