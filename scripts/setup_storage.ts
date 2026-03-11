import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Configurando Supabase Storage via SQL...");

    try {
        // 1. Garantir que o bucket crm-media existe e é público
        await prisma.$executeRawUnsafe(`
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('crm-media', 'crm-media', true)
            ON CONFLICT (id) DO UPDATE SET public = true;
        `);
        console.log("✅ Bucket 'crm-media' verificado/criado como público.");

        // 2. Criar política de leitura (SELECT)
        try {
            await prisma.$executeRawUnsafe(`
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'crm-media');
            `);
            console.log("✅ Política de Leitura (SELECT) criada.");
        } catch (e: any) {
            // Ignora se a política já existir
            if (!e.message.includes("already exists")) console.error("Aviso SELECT:", e.message);
        }

        // 3. Criar política de inserção (INSERT) - Permite qualquer um enviar arquivos
        try {
            await prisma.$executeRawUnsafe(`
                CREATE POLICY "Public Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'crm-media');
            `);
            console.log("✅ Política de Upload (INSERT) criada.");
        } catch (e: any) {
            if (!e.message.includes("already exists")) console.error("Aviso INSERT:", e.message);
        }

        // 4. Criar política de atualização (UPDATE)
        try {
            await prisma.$executeRawUnsafe(`
                CREATE POLICY "Public Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'crm-media');
            `);
            console.log("✅ Política de Atualização (UPDATE) criada.");
        } catch (e: any) {
            if (!e.message.includes("already exists")) console.error("Aviso UPDATE:", e.message);
        }

        // 5. Criar política de remoção (DELETE)
        try {
            await prisma.$executeRawUnsafe(`
                CREATE POLICY "Public Deletes" ON storage.objects FOR DELETE USING (bucket_id = 'crm-media');
            `);
            console.log("✅ Política de Exclusão (DELETE) criada.");
        } catch (e: any) {
            if (!e.message.includes("already exists")) console.error("Aviso DELETE:", e.message);
        }

        console.log("🚀 Todas as configurações de Storage foram aplicadas com sucesso!");

    } catch (error) {
        console.error("Erro fatal ao configurar storage:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
