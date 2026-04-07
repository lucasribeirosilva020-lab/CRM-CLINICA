const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clinica = await prisma.clinica.findFirst({
        select: { id: true, slug: true }
    });
    console.log(JSON.stringify(clinica));
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
