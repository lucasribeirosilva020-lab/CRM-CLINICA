'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !senha) {
            setErro('Preencha todos os campos');
            return;
        }
        setLoading(true);
        setErro('');

        const result = await login(email, senha);
        setLoading(false);

        if (result.success) {
            toast.success('Bem-vindo ao CRM!');
            router.push('/dashboard');
        } else {
            setErro(result.error || 'Credenciais inválidas');
        }
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5" />
            </div>

            <div className="w-full max-w-sm relative animate-fade-in">
                {/* Card */}
                <div className="bg-white rounded-2xl border border-border p-8 shadow-modal">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-card">
                            <Activity className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-text">CRM Clínica</h1>
                        <p className="text-sm text-text-muted mt-1">Faça login para continuar</p>
                    </div>

                    {/* Error */}
                    {erro && (
                        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error/10 border border-error/20">
                            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                            <p className="text-sm text-error">{erro}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label" htmlFor="email">E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="input pl-9"
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label" htmlFor="senha">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    id="senha"
                                    type={showSenha ? 'text' : 'password'}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pl-9 pr-10"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSenha(!showSenha)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text transition-colors"
                                >
                                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full justify-center py-2.5 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Entrando...
                                </span>
                            ) : 'Entrar'}
                        </button>
                    </form>

                    {/* Credenciais demo */}
                    <div className="mt-6 p-3 rounded-xl bg-secondary border border-primary/10">
                        <p className="text-xs font-semibold text-primary mb-2">🔑 Credenciais de demonstração</p>
                        <div className="space-y-1">
                            {[
                                { label: 'Admin', email: 'admin@crm.com', senha: 'admin123' },
                                { label: 'Vendedor', email: 'vendedor@crm.com', senha: 'vendedor123' },
                                { label: 'Atendente', email: 'atendente@crm.com', senha: 'atendente123' },
                            ].map((c) => (
                                <button
                                    key={c.email}
                                    type="button"
                                    onClick={() => { setEmail(c.email); setSenha(c.senha); }}
                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                                >
                                    <span className="text-xs font-medium text-primary">{c.label}:</span>
                                    <span className="text-xs text-text-muted ml-1">{c.email}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-text-muted mt-4">
                    Não tem uma conta?{' '}
                    <Link href="/signup" className="text-primary font-bold hover:underline">
                        Cadastre sua Clínica
                    </Link>
                </p>

                <p className="text-center text-[10px] text-text-muted mt-2">
                    CRM Clínica v1.0 — Sistema de Gestão
                </p>
            </div>
        </div>
    );
}
