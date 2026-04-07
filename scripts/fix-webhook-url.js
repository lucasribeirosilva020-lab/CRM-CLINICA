const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.configuracaoClinica.update({
    where: { clinicaId: 'cmmcadxx400088sce6f5vfe3j' },
    data: { webhookN8nUrl: 'https://servidor-n8n.kmtsni.easypanel.host/webhook-test/sofia' }
  });
  console.log('URL corrigida:', updated.webhookN8nUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
