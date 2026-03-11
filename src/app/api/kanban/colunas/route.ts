import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { withAuth } from '@/lib/api-middleware';

// Função auxiliar para gerar slug a partir do nome
function slugify(text: string) {
    return text
        .toString()
        .normalize('NFD') // Remove acentos
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')     // Espaços por underline (pois o default é fila_espera, etc)
        .replace(/[^\w-]+/g, '')  // Remove caracteres não-alfanuméricos
        .replace(/--+/g, '_');    // Substitui múltiplos hífens por underline
}

// GET - Busca as colunas do kanban do tipo especificado
export const GET = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;
    const url = new URL(req.url);
    const tipo = url.searchParams.get('tipo') || 'ATENDIMENTO'; // ATENDIMENTO ou VENDAS

    try {
        const { data: colunas, error: gError } = await supabaseAdmin
            .from('KanbanColuna')
            .select('*')
            .eq('clinicaId', clinicaId)
            .eq('tipo', tipo)
            .eq('arquivada', false)
            .order('ordem', { ascending: true });

        if (gError) throw gError;

        // Caso a clínica não tenha colunas e seja o primeiro acesso, vamos injetar as colunas padrão no banco
        if (!colunas || colunas.length === 0) {
            const defaultAtendimento = [
                { nome: 'Fila de Espera', cor: '#E8EAED', slug: 'fila_espera' },
                { nome: 'Em Atendimento', cor: '#E8F0FE', slug: 'em_atendimento' },
                { nome: 'Aguardando Resposta', cor: '#FEF7E0', slug: 'aguardando_resposta' },
            ];

            const defaultVendas = [
                { nome: 'Contato Inicial', cor: '#E8EAED', slug: 'contato_inicial' },
                { nome: 'Qualificação', cor: '#E8F0FE', slug: 'qualificacao' },
                { nome: 'Apresentação/Avaliação', cor: '#FEF7E0', slug: 'apresentacao' },
                { nome: 'Negociação', cor: '#FCE8E6', slug: 'negociacao' },
            ];

            const defaults = tipo === 'ATENDIMENTO' ? defaultAtendimento : defaultVendas;

            // Cria todas em lote via upsert ou insert
            const { error: iError } = await supabaseAdmin
                .from('KanbanColuna')
                .insert(defaults.map((col, index) => ({
                    clinicaId,
                    tipo,
                    nome: col.nome,
                    cor: col.cor,
                    slug: col.slug,
                    ordem: index,
                })));

            if (iError) throw iError;

            // Re-busca as colunas recém criadas
            const { data: novasColunas, error: nError } = await supabaseAdmin
                .from('KanbanColuna')
                .select('*')
                .eq('clinicaId', clinicaId)
                .eq('tipo', tipo)
                .eq('arquivada', false)
                .order('ordem', { ascending: true });

            if (nError) throw nError;
            return NextResponse.json({ success: true, data: novasColunas });
        }

        return NextResponse.json({ success: true, data: colunas });
    } catch (error: any) {
        console.error('[KANBAN COLUNAS GET]', error);
        return NextResponse.json({ success: false, error: 'Erro ao buscar colunas' }, { status: 500 });
    }
});

// POST - Cria nova coluna
export const POST = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;

    // Apenas admin pode criar coluna
    if (user.perfil !== 'ADMIN') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { nome, cor, tipo } = body;

        if (!nome || !tipo) {
            return NextResponse.json({ success: false, error: 'Nome e tipo são obrigatórios' }, { status: 400 });
        }

        let slug = slugify(nome);

        // Verifica se slug já existe
        const { data: existente } = await supabaseAdmin
            .from('KanbanColuna')
            .select('id')
            .eq('clinicaId', clinicaId)
            .eq('tipo', tipo)
            .eq('slug', slug)
            .maybeSingle();

        if (existente) {
            slug = `${slug}_${Date.now()}`;
        }

        // Pega a ultima ordem
        const { data: ultimaColuna } = await supabaseAdmin
            .from('KanbanColuna')
            .select('ordem')
            .eq('clinicaId', clinicaId)
            .eq('tipo', tipo)
            .eq('arquivada', false)
            .order('ordem', { ascending: false })
            .limit(1)
            .maybeSingle();

        const novaOrdem = (ultimaColuna as any) ? (ultimaColuna as any).ordem + 1 : 0;

        const { data: novaColuna, error: cError } = await supabaseAdmin
            .from('KanbanColuna')
            .insert({
                clinicaId,
                tipo,
                nome,
                cor: cor || '#E8EAED',
                slug,
                ordem: novaOrdem,
            })
            .select()
            .single();

        if (cError) throw cError;

        return NextResponse.json({ success: true, data: novaColuna });
    } catch (error: any) {
        console.error('[KANBAN COLUNAS POST]', error);
        return NextResponse.json({ success: false, error: 'Erro ao criar coluna' }, { status: 500 });
    }
});

// PUT (em lote) - Para salvar a reordenação (drag & drop)
export const PUT = withAuth(async (req: NextRequest, user: any) => {
    const clinicaId = user.clinicaId;

    if (user.perfil !== 'ADMIN') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { colunas } = body; // Array { id, ordem }

        if (!Array.isArray(colunas)) {
            return NextResponse.json({ success: false, error: 'Formato inválido' }, { status: 400 });
        }

        // Usando RPC ou loops (o ideal no Supabase seria um RPC, mas vamos simular via loop ou upsert em lote se possível)
        // Como o ID é o mesmo, podemos usar upsert com as colunas que mudaram
        const { error: uError } = await supabaseAdmin
            .from('KanbanColuna')
            .upsert(colunas.map(col => ({
                id: col.id,
                clinicaId, // Segurança redundante
                ordem: col.ordem
            })));

        if (uError) throw uError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[KANBAN COLUNAS PUT BATCH]', error);
        return NextResponse.json({ success: false, error: 'Erro ao reordenar colunas' }, { status: 500 });
    }
});
