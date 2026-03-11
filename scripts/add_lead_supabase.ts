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
    console.log(`Buscando usuários em: ${supabaseUrl}`);

    // Buscar usuários
    const { data: users, error: userError } = await supabase
        .from('Usuario')
        .select('id, nome, clinicaId');

    if (userError) {
        console.error('Erro ao buscar usuários:', userError);
        return;
    }

    console.log('Usuários encontrados:', users);

    const juju = users.find(u => u.nome.toLowerCase().includes('juju'));
    const targetUser = juju || users[0];

    if (!targetUser) {
        console.error('Nenhum usuário encontrado.');
        return;
    }

    console.log(`Criando lead para: ${targetUser.nome} (Clínica: ${targetUser.clinicaId})`);

    const telefoneFake = `551199999${Math.floor(Math.random() * 9000) + 1000}`;

    const leadId = 'cm' + Math.random().toString(36).substring(2, 10);
    const conversaId = 'cm' + Math.random().toString(36).substring(2, 10);

    const now = new Date().toISOString();

    // 1. Criar Lead
    const { data: lead, error: leadError } = await supabase
        .from('Lead')
        .insert([{
            id: leadId,
            clinicaId: targetUser.clinicaId,
            nome: 'Paciente Teste Supabase',
            telefone: telefoneFake,
            tags: '["Teste"]',
            createdAt: now,
            updatedAt: now
        }])
        .select()
        .single();

    if (leadError) {
        console.error('Erro ao criar lead:', leadError);
        return;
    }

    // 2. Criar Conversa
    const { data: conversa, error: convError } = await supabase
        .from('Conversa')
        .insert([{
            id: conversaId,
            clinicaId: targetUser.clinicaId,
            leadId: lead.id,
            atendenteId: targetUser.id,
            kanbanAtenStat: 'fila_espera',
            ultimaMensagem: 'Teste Supabase!',
            ultimaMensagemAt: new Date().toISOString(),
            createdAt: now,
            updatedAt: now
        }]);

    if (convError) {
        console.error('Erro ao criar conversa:', convError);
        return;
    }

    console.log(`✅ Lead '${lead.nome}' criado com sucesso para ${targetUser.nome}!`);
}

main();
