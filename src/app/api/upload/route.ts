import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;
        const bucket = (formData.get('bucket') as string) || 'crm-media';

        console.log(`[UPLOAD API] Iniciando upload: bucket=${bucket}, path=${path}, type=${file?.type}, size=${file?.size}`);

        if (!file) {
            console.error('[UPLOAD API] Erro: Arquivo não fornecido no FormData');
            return NextResponse.json({ success: false, error: 'Arquivo não fornecido' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        console.log(`[UPLOAD API] Buffer criado, tamanho: ${buffer.length}`);

        const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path || `${crypto.randomUUID()}`, buffer, {
                contentType: file.type,
                upsert: true
            });

        if (error) {
            console.error('[UPLOAD API] Erro Supabase:', error);
            return NextResponse.json({ success: false, error: `Erro Supabase: ${error.message}` }, { status: 500 });
        }

        console.log(`[UPLOAD API] Upload concluído com sucesso: ${data.path}`);

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return NextResponse.json({ success: true, publicUrl });
    } catch (error: any) {
        console.error('[UPLOAD API] Falha fatal:', error);
        return NextResponse.json({ success: false, error: `Falha interna: ${error.message}` }, { status: 500 });
    }
}
