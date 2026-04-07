const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const clinicaId = 'cmmcadxx400088sce6f5vfe3j'; // From user's n8n JSON
    console.log('Verificando clinicaId:', clinicaId);
    
    const { data, error } = await supabase
        .from('ConfiguracaoClinica')
        .select('*')
        .eq('clinicaId', clinicaId);
    
    console.log('Data:', data);
    console.log('Error:', error);

    if (data) {
        console.log('Tentando upsert...');
        const { data: upsertData, error: upsertError } = await supabase
            .from('ConfiguracaoClinica')
            .upsert({
                clinicaId,
                whatsappModo: 'n8n',
                webhookN8nUrl: 'https://servidor-n8n.kmtsni.easypanel.host/webhook/sofia',
                updatedAt: new Date().toISOString()
            }, { onConflict: 'clinicaId' })
            .select();
        
        console.log('Upsert result:', upsertData);
        console.log('Upsert error:', upsertError);
    }
}

check();
