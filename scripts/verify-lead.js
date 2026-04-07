const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const lead = await prisma.lead.findFirst({
        where: { telefone: '5511999999999' },
        include: { 
            conversa: { 
                include: { 
                    mensagens: {
                        orderBy: { timestamp: 'desc' },
                        take: 1
                    } 
                } 
            } 
        }
    });
    console.log(JSON.stringify(lead, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);
