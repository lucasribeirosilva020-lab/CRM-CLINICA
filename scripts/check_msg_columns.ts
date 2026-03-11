import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkColumns() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('--- VERIFICANDO COLUNAS DE MENSAGEM ---');

    // Tenta pegar uma mensagem para ver os campos
    const { data, error } = await supabase.from('Mensagem').select('*').limit(1);

    if (error) {
        console.error('Erro ao buscar mensagem:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('Campos encontrados na primeira mensagem:', Object.keys(data[0]));
    } else {
        console.log('Nenhuma mensagem encontrada. Verificando estrutura via query RPC (se disponível) ou apenas assumindo falta de campos.');
        // Vamos tentar inserir uma e ver o erro detalhado
        const { error: insError } = await supabase.from('Mensagem').insert({
            clinicaId: 'test',
            conversaId: 'test',
            conteudo: 'test',
            de: 'test',
            url: 'test'
        });
        if (insError) {
            console.log('Erro ao tentar inserir com campo "url":', insError.message);
        } else {
            console.log('SUCESSO! O campo "url" existe.');
        }
    }
}

checkColumns();
