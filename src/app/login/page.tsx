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
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[120px]" />
            </div>

            <div className="w-full max-w-sm relative animate-fade-in">
                {/* Card */}
                <div className="bg-white p-10 rounded-[32px] shadow-xl border border-gray-200">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary-400 flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 scale-110">
                            <Activity className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Clinify</h1>
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-[0.2em] mt-2">Health Management</p>
                    </div>

                    {/* Error */}
                    {erro && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-error/10 border border-error/20 animate-slide-in-up">
                            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                            <p className="text-sm font-semibold text-error">{erro}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="label text-gray-500 ml-1" htmlFor="email">E-mail Corporativo</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@clinify.com"
                                    className="input !pl-16 h-12"
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label text-gray-500 ml-1" htmlFor="senha">Senha de Acesso</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    id="senha"
                                    type={showSenha ? 'text' : 'password'}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    className="input !pl-16 !pr-16 h-12"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSenha(!showSenha)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                >
                                    {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full h-12 justify-center text-base"
                        >
                            {loading ? (
                                <span className="flex items-center gap-3 font-bold">
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Autenticando...
                                </span>
                            ) : 'Entrar na Plataforma'}
                        </button>
                    </form>

                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    © 2024 Clinify • Todos os direitos reservados
                </p>
            </div>
        </div>
    );
}
