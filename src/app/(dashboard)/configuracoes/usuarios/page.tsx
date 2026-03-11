'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { User, Shield, CheckCircle2, XCircle, Search, Edit2, UserPlus, Clock } from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: 'ADMIN' | 'VENDEDOR' | 'ATENDENTE';
    ativo: boolean;
    ultimoAcesso: string;
}

const USUARIOS_MOCK: Usuario[] = [
    { id: '1', nome: 'Admin Sistema', email: 'admin@clinicacielo.com.br', perfil: 'ADMIN', ativo: true, ultimoAcesso: 'Agora' },
    { id: '2', nome: 'Carlos Vendedor', email: 'carlos@clinicacielo.com.br', perfil: 'VENDEDOR', ativo: true, ultimoAcesso: 'há 15 min' },
    { id: '3', nome: 'Ana Atendente', email: 'ana@clinicacielo.com.br', perfil: 'ATENDENTE', ativo: true, ultimoAcesso: 'há 2h' },
    { id: '4', nome: 'Mariana Silva', email: 'mariana@clinicacielo.com.br', perfil: 'VENDEDOR', ativo: false, ultimoAcesso: 'há 3 dias' },
    { id: '5', nome: 'João Pedro', email: 'joao@clinicacielo.com.br', perfil: 'ATENDENTE', ativo: true, ultimoAcesso: 'há 1 dia' },
];

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_MOCK);
    const [busca, setBusca] = useState('');

    const usuariosFiltrados = usuarios.filter(u =>
        u.nome.toLowerCase().includes(busca.toLowerCase()) ||
        u.email.toLowerCase().includes(busca.toLowerCase())
    );

    const toggleStatus = (id: string) => {
        setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u));
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative z-0">
            <Header
                title="Acompanhamento de Usuários"
                subtitle="Gerencie atendentes, vendedores e permissões"
                actions={
                    <button className="btn-primary py-1.5 px-3 text-xs gap-2">
                        <UserPlus className="w-4 h-4" />
                        Novo Usuário
                    </button>
                }
            />

            <div className="p-4 space-y-4 max-w-5xl mx-auto w-full">
                {/* Busca e Filtros */}
                <div className="card flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar por nome ou email..."
                            className="input pl-9 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Total: {usuarios.length} usuários</span>
                    </div>
                </div>

                {/* Lista de Usuários */}
                <div className="card overflow-hidden p-0 border-none shadow-soft">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-border">
                                    <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Usuário</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Perfil</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Último Acesso</th>
                                    <th className="px-4 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {usuariosFiltrados.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={getAvatarUrl(u.nome, 32)}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-text truncate">{u.nome}</p>
                                                    <p className="text-xs text-text-muted truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                'px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit',
                                                u.perfil === 'ADMIN' ? 'bg-primary/10 text-primary' :
                                                    u.perfil === 'VENDEDOR' ? 'bg-warning/10 text-warning' :
                                                        'bg-secondary text-primary'
                                            )}>
                                                <Shield className="w-3 h-3" />
                                                {u.perfil}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {u.ativo ? (
                                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-error" />
                                                )}
                                                <span className={cn('text-xs font-medium', u.ativo ? 'text-success' : 'text-error')}>
                                                    {u.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-text-muted flex items-center gap-1.5 mt-2 border-none">
                                            <Clock className="w-3.5 h-3.5" />
                                            {u.ultimoAcesso}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(u.id)}
                                                    className={cn(
                                                        'text-[10px] font-bold px-2 py-1 rounded-lg border transition-all',
                                                        u.ativo ? 'border-error/20 text-error hover:bg-error/5' : 'border-success/20 text-success hover:bg-success/5'
                                                    )}
                                                >
                                                    {u.ativo ? 'Desativar' : 'Ativar'}
                                                </button>
                                                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-text-muted transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
