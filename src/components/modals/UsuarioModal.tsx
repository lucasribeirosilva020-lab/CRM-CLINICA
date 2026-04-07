'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
}

interface UsuarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    usuario?: Usuario | null;
}

export default function UsuarioModal({ isOpen, onClose, onSuccess, usuario }: UsuarioModalProps) {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [perfil, setPerfil] = useState('ATENDENTE');
    const [ativo, setAtivo] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (usuario) {
            setNome(usuario.nome);
            setEmail(usuario.email);
            setSenha(''); // Senha não vem no GET
            setPerfil(usuario.perfil);
            setAtivo(usuario.ativo);
        } else {
            setNome('');
            setEmail('');
            setSenha('');
            setPerfil('ATENDENTE');
            setAtivo(true);
        }
    }, [usuario, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = usuario
                ? `/api/admin/users/${usuario.id}`
                : '/api/admin/users';

            const method = usuario ? 'PATCH' : 'POST';

            const body: any = { nome, email, perfil, ativo };
            if (senha) body.senha = senha;
            if (!usuario && !senha) {
                toast.error('Senha é obrigatória para novos usuários');
                setLoading(false);
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (data.success) {
                toast.success(usuario ? 'Usuário atualizado!' : 'Usuário criado!');
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || 'Erro ao salvar usuário');
            }
        } catch (error) {
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 animate-in fade-in duration-200 text-gray-900">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold">
                        {usuario ? 'Editar Membro' : 'Novo Membro da Equipe'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="input pl-9"
                                placeholder="Nome do colaborador"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input pl-9"
                                placeholder="email@clinica.com"
                                required
                                disabled={!!usuario}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">
                            {usuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                            <input
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="input pl-9"
                                placeholder="••••••••"
                                required={!usuario}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Perfil de Acesso</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['VENDEDOR', 'ATENDENTE'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPerfil(p)}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-sm font-medium transition-all",
                                        perfil === p
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                                    )}
                                >
                                    {perfil === p && <Check className="w-3.5 h-3.5" />}
                                    {p.charAt(0) + p.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {usuario && (
                        <div className="flex items-center gap-3 py-2">
                            <input
                                id="ativo"
                                type="checkbox"
                                checked={ativo}
                                onChange={(e) => setAtivo(e.target.checked)}
                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                            />
                            <label htmlFor="ativo" className="text-sm font-medium text-text mt-0.5">
                                Usuário Ativo
                            </label>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-ghost flex-1 justify-center text-gray-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1 justify-center shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
