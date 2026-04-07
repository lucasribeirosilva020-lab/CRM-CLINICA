const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.configuracaoClinica.findMany({
    include: { clinica: true }
  });
  console.log('CONFIGS:', JSON.stringify(configs, null, 2));

  const someLeads = await prisma.lead.findMany({ take: 5 });
  console.log('LEADS:', JSON.stringify(someLeads, null, 2));

  const someMsgs = await prisma.mensagem.findMany({ take: 5, orderBy: { timestamp: 'desc' } });
  console.log('MSGS:', JSON.stringify(someMsgs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
