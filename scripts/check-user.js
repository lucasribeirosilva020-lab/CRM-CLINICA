const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.usuario.findFirst({
            where: { email: 'lucasribeirosilva020@gmail.com' }
        });
        if (user) {
            console.log('User found:');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Senha (Hash):', user.senha);
            console.log('Ativo:', user.ativo);
        } else {
            console.log('User not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
