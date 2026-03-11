import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { nome, clinicaNome, email, senha } = await req.json();

        if (!nome || !clinicaNome || !email || !senha) {
            return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes' }, { status: 400 });
        }

        // Verifica se usuário já existe
        const usuarioExistente = await prisma.usuario.findFirst({
            where: { email }
        });

        if (usuarioExistente) {
            return NextResponse.json({ success: false, error: 'E-mail já cadastrado' }, { status: 400 });
        }

        // Cria slug para a clínica
        const slug = clinicaNome.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

        // Password Hash
        const hashedSenha = await bcrypt.hash(senha, 10);

        // Cria Clínica e Usuário Administrador (Transação)
        const result = await prisma.$transaction(async (tx) => {
            const clinica = await tx.clinica.create({
                data: {
                    nome: clinicaNome,
                    slug,
                    configuracoes: {
                        create: {
                            diasInatividade: 30,
                            slaMinutos: 60
                        }
                    },
                    kanbanColunas: {
                        createMany: {
                            data: [
                                { nome: 'Novo Lead', cor: '#1A73E8', ordem: 0, slug: 'novo-lead' },
                                { nome: 'Em Atendimento', cor: '#FBBC04', ordem: 1, slug: 'em-atendimento' },
                                { nome: 'Agendado', cor: '#34A853', ordem: 2, slug: 'agendado' },
                                { nome: 'Finalizado', cor: '#5F6368', ordem: 3, slug: 'finalizado' }
                            ]
                        }
                    }
                }
            });

            const usuario = await tx.usuario.create({
                data: {
                    nome,
                    email,
                    senha: hashedSenha,
                    perfil: 'ADMIN',
                    clinicaId: clinica.id
                }
            });

            return { clinica, usuario };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Erro no Signup:', error);
        return NextResponse.json({ success: false, error: error.message || 'Erro interno no servidor' }, { status: 500 });
    }
}
