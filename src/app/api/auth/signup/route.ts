import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { nome, clinicaNome, email, senha } = await req.json();

        if (!nome || !clinicaNome || !email || !senha) {
            return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // 1. Verifica se usuário já existe
        const { data: usuarioExistente } = await supabaseAdmin
            .from('Usuario')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (usuarioExistente) {
            return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 });
        }

        // 2. Cria slug para a clínica
        const slug = clinicaNome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const hashedSenha = await bcrypt.hash(senha, 10);
        const nowDate = new Date().toISOString();

        // 3. Cria Clínica (Manual Transaction simulation)
        const { data: clinica, error: cError } = await supabaseAdmin
            .from('Clinica')
            .insert({
                id: crypto.randomUUID(),
                nome: clinicaNome,
                slug,
                createdAt: nowDate,
                updatedAt: nowDate
            })
            .select()
            .single();

        if (cError || !clinica) throw cError;

        try {
            // 4. Cria Configurações e Colunas Kanban
            await Promise.all([
                supabaseAdmin.from('ConfiguracaoClinica').insert({
                    clinicaId: clinica.id,
                    diasInatividade: 30,
                    slaMinutos: 60,
                    updatedAt: nowDate
                }),
                supabaseAdmin.from('KanbanColuna').insert([
                    { clinicaId: clinica.id, nome: 'Novo Lead', cor: '#1A73E8', ordem: 0, slug: 'novo-lead', tipo: 'ATENDIMENTO' },
                    { clinicaId: clinica.id, nome: 'Em Atendimento', cor: '#FBBC04', ordem: 1, slug: 'em-atendimento', tipo: 'ATENDIMENTO' },
                    { clinicaId: clinica.id, nome: 'Agendado', cor: '#34A853', ordem: 2, slug: 'agendado', tipo: 'ATENDIMENTO' },
                    { clinicaId: clinica.id, nome: 'Finalizado', cor: '#5F6368', ordem: 3, slug: 'finalizado', tipo: 'ATENDIMENTO' }
                ])
            ]);

            // 5. Cria Usuário
            const { data: usuario, error: uError } = await supabaseAdmin
                .from('Usuario')
                .insert({
                    id: crypto.randomUUID(),
                    nome,
                    email: email.toLowerCase(),
                    senha: hashedSenha,
                    perfil: 'ADMIN',
                    clinicaId: clinica.id,
                    createdAt: nowDate,
                    updatedAt: nowDate
                })
                .select()
                .single();

            if (uError) throw uError;

            return NextResponse.json({ success: true, data: { clinica, usuario } });

        } catch (innerError) {
            // Rollback manual da clínica se algo falhar no processo secundário
            await supabaseAdmin.from('Clinica').delete().eq('id', clinica.id);
            throw innerError;
        }

    } catch (error: any) {
        console.error('Erro no Signup:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
    }
}

