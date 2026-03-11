import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manualmente
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=:]+?)[=:](.*)/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/['"]/g, '');
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log(`Testando upload em: ${supabaseUrl}`);
    console.log(`Chave Anon configurada: ${supabaseKey?.substring(0, 10)}...`);

    try {
        const dummyContent = 'Hello World!';
        // No node environment, Blob might be tricky, use Buffer/ArrayBuffer directly if needed or raw string for raw upload
        const dummyBuffer = Buffer.from(dummyContent, 'utf-8');

        const { data, error } = await supabase.storage
            .from('crm-media')
            .upload('test_upload.txt', dummyBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'text/plain'
            });

        if (error) {
            console.error('Falha no upload! Detalhes do erro:', error.message, error.name);
        } else {
            console.log('Upload de teste realizado com sucesso!', data);
        }

    } catch (err) {
        console.error('Erro geral:', err);
    }
}

testUpload();
