const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clinicaIdValue = "cmmcadxx400088sce6f5vfe3j";
  
  // 1. Check Last 10 messages
  const messages = await prisma.mensagem.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { 
      conversa: { 
        include: { 
          lead: true 
        } 
      } 
    }
  });
  console.log('\n--- ÚLTIMAS 10 MENSAGENS NO SISTEMA ---');
  messages.forEach(m => {
    console.log(`[${m.timestamp.toISOString()}] De: ${m.de} | Lead: ${m.conversa?.lead?.nome} (${m.conversa?.lead?.telefone}) | Conteúdo: ${m.conteudo.substring(0, 50)}`);
  });

  // 2. Check specific lead "Joao"
  const joao = await prisma.lead.findFirst({
    where: { nome: { contains: 'João' } }
  });
  console.log('\n--- DADOS DO JOÃO NO BANCO ---');
  console.log(JSON.stringify(joao, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
