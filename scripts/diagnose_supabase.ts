import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function diagnose() {
    console.log('--- DIAGNÓSTICO SUPABASE ---');
    console.log('URL:', supabaseUrl);
    console.log('Chave Anon (Início):', anonKey.substring(0, 15) + '...');
    console.log('Chave Service (Início):', supabaseServiceKey.substring(0, 15) + '...');

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('ERRO: Variáveis de ambiente faltando no .env!');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\n1. Testando conexão com Banco de Dados (Tabela Usuario)...');
    const { data: users, error: dbError } = await supabase.from('Usuario').select('count', { count: 'exact', head: true });
    if (dbError) {
        console.error('ERRO DB:', dbError.message);
    } else {
        console.log('SUCESSO DB! Total de usuários encontrado:', users);
    }

    console.log('\n2. Testando acesso ao Storage (Listar Buckets)...');
    const { data: buckets, error: stError } = await supabase.storage.listBuckets();
    if (stError) {
        console.error('ERRO STORAGE:', stError.message);
    } else {
        console.log('SUCESSO STORAGE! Buckets encontrados:', buckets.map(b => b.name).join(', '));

        const hasMedia = buckets.find(b => b.name === 'crm-media');
        if (!hasMedia) {
            console.error('AVISO: O bucket "crm-media" NÃO EXISTE! Isso causará erro de upload.');
        }
    }

    console.log('\n3. Testando Upload de Arquivo de Teste...');
    const testBuffer = Buffer.from('teste de diagnóstico');
    const { data: uploadData, error: upError } = await supabase.storage
        .from('crm-media')
        .upload(`test_diag_${Date.now()}.txt`, testBuffer, {
            contentType: 'text/plain',
            upsert: true
        });

    if (upError) {
        console.error('ERRO UPLOAD:', upError.message);
    } else {
        console.log('SUCESSO UPLOAD! Arquivo criado:', uploadData.path);
        const { data: { publicUrl } } = supabase.storage.from('crm-media').getPublicUrl(uploadData.path);
        console.log('URL Pública:', publicUrl);
    }
}

diagnose();
