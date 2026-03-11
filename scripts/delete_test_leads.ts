import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const env: any = {};
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=:]+?)[=:](.*)/);
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
        }
    });
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log(`Limpando leads de teste em: ${supabaseUrl}`);

    // Buscar leads que contenham "Teste" no nome ou tags
    const { data: leads, error: fetchError } = await supabase
        .from('Lead')
        .select('id, nome');

    if (fetchError) {
        console.error('Erro ao buscar leads:', fetchError);
        return;
    }

    const testLeads = leads.filter(l => l.nome.toLowerCase().includes('teste'));
    
    if (testLeads.length === 0) {
        console.log('Nenhum lead de teste encontrado.');
        return;
    }

    console.log(`Encontrados ${testLeads.length} leads de teste. Removendo...`);

    for (const lead of testLeads) {
        console.log(`Limpando dependências de: ${lead.nome}`);
        const { data: conversas } = await supabase.from('Conversa').select('id').eq('leadId', lead.id);
        const convIds = conversas?.map(c => c.id) || [];
        
        if (convIds.length > 0) {
            await supabase.from('Mensagem').delete().in('conversaId', convIds);
            await supabase.from('Conversa').delete().in('id', convIds);
        }
        
        const { error: delError } = await supabase.from('Lead').delete().eq('id', lead.id);
        
        if (delError) {
            console.error(`Erro ao remover lead ${lead.nome}:`, delError);
        } else {
            console.log(`✅ Lead '${lead.nome}' removido.`);
        }
    }
}

main();
