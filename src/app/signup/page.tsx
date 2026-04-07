'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Eye, EyeOff, Lock, Mail, AlertCircle, Building, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
    const [nome, setNome] = useState('');
    const [clinicaNome, setClinicaNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [showSenha, setShowSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || !clinicaNome || !email || !senha) {
            setErro('Preencha todos os campos');
            return;
        }
        setLoading(true);
        setErro('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, clinicaNome, email, senha })
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Conta criada com sucesso! Faça login.');
                router.push('/login');
            } else {
                setErro(data.error || 'Erro ao criar conta');
            }
        } catch (error) {
            setErro('Erro de conexão no servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5" />
            </div>

            <div className="w-full max-w-sm relative animate-fade-in">
                <div className="bg-white rounded-2xl border border-border p-8 shadow-modal">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-card">
                            <Activity className="w-7 h-7 text-gray-900" />
                        </div>
                        <h1 className="text-xl font-bold text-text">Criar Nova Conta</h1>
                        <p className="text-sm text-text-muted mt-1">Sua jornada começa aqui</p>
                    </div>

                    {erro && (
                        <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error/10 border border-error/20">
                            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                            <p className="text-sm text-error">{erro}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Seu nome"
                                    className="input pl-9"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Nome da Clínica</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    type="text"
                                    value={clinicaNome}
                                    onChange={(e) => setClinicaNome(e.target.value)}
                                    placeholder="Ex: Clínica Bem Estar"
                                    className="input pl-9"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">E-mail Administrativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="input pl-9"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    type={showSenha ? 'text' : 'password'}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    className="input pl-9 pr-10"
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
                            {loading ? 'Criando conta...' : 'Cadastrar'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-text-muted">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-primary font-bold hover:underline">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
