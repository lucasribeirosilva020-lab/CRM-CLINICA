import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import bcrypt from 'bcryptjs';

// PATCH: Atualizar usuário (Nome, Perfil, Ativo, Senha)
export const PATCH = withAuth(async (req: Request, user: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 });
        }

        const { nome, perfil, ativo, senha } = await req.json();

        const data: any = {};
        if (nome !== undefined) data.nome = nome;
        if (perfil !== undefined) data.perfil = perfil;
        if (ativo !== undefined) data.ativo = ativo;
        if (senha) {
            data.senha = await bcrypt.hash(senha, 10);
        }

        const atualizado = await prisma.usuario.update({
            where: { id, clinicaId: user.clinicaId },
            data,
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true
            }
        });

        return NextResponse.json({ success: true, data: atualizado });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
