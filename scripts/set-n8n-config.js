const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.configuracaoClinica.update({
        where: { clinicaId: 'cmmcadxx400088sce6f5vfe3j' },
        data: { whatsappModo: 'n8n', webhookN8nUrl: 'http://localhost:9999/webhook-test' }
    });
    console.log('Config n8n salva');
    await prisma.$disconnect();
}
main();
