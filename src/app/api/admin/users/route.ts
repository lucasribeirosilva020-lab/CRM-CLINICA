import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api-middleware';
import bcrypt from 'bcryptjs';

// GET: Listar usuários da clínica
export const GET = withAuth(async (req: Request, user: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const usuarios = await prisma.usuario.findMany({
            where: { clinicaId: user.clinicaId },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                createdAt: true,
                avatar: true
            },
            orderBy: { nome: 'asc' }
        });

        return NextResponse.json({ success: true, data: usuarios });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});

// POST: Criar novo usuário na clínica
export const POST = withAuth(async (req: Request, user: any) => {
    try {
        if (user.perfil !== 'ADMIN') {
            return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 });
        }

        const { nome, email, senha, perfil } = await req.json();

        if (!nome || !email || !senha || !perfil) {
            return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // Verifica se e-mail já existe na clínica (ou globalmente se preferir)
        const existe = await prisma.usuario.findFirst({
            where: { email }
        });

        if (existe) {
            return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 });
        }

        const hashedSenha = await bcrypt.hash(senha, 10);

        const novoUsuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: hashedSenha,
                perfil,
                clinicaId: user.clinicaId
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true
            }
        });

        return NextResponse.json({ success: true, data: novoUsuario });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
});
