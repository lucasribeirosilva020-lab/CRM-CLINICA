'use client';

import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/utils';
import { User, Lock, Mail, Camera } from 'lucide-react';

export default function PerfilPage() {
    const { usuario } = useAuth();

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <Header title="Meu Perfil" subtitle="Configurações da conta" back="/configuracoes" />

            <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
                {/* Header Profile */}
                <div className="card flex items-center flex-col sm:flex-row gap-6 text-center sm:text-left">
                    <div className="relative group cursor-pointer">
                        <img
                            src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'U', 80)}
                            alt={usuario?.nome}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-soft"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-text mb-1">{usuario?.nome}</h2>
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary text-primary">
                            Perfil: {usuario?.perfil}
                        </span>
                        <p className="text-sm text-text-muted mt-2">
                            Clínica vinculada: <strong>{usuario?.clinica.nome || 'CRM Clínica'}</strong>
                        </p>
                    </div>
                </div>

                {/* Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dados Básicos */}
                    <div className="card space-y-4">
                        <h3 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
                            <User className="w-4 h-4 text-primary" />
                            Dados Base
                        </h3>
                        <div>
                            <label className="label">Nome Completo</label>
                            <input type="text" defaultValue={usuario?.nome} className="input" />
                        </div>
                        <div>
                            <label className="label">E-mail</label>
                            <input type="email" defaultValue={usuario?.email} disabled className="input bg-gray-50 text-text-light" />
                            <p className="text-[10px] text-text-muted mt-1">O e-mail não pode ser alterado diretamente.</p>
                        </div>
                        <button className="btn-primary w-full justify-center py-2">Salvar Alterações</button>
                    </div>

                    {/* Segurança */}
                    <div className="card space-y-4">
                        <h3 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Segurança
                        </h3>
                        <div>
                            <label className="label">Senha Atual</label>
                            <input type="password" placeholder="••••••••" className="input" />
                        </div>
                        <div>
                            <label className="label">Nova Senha</label>
                            <input type="password" placeholder="••••••••" className="input" />
                        </div>
                        <div>
                            <label className="label">Confirmar Nova Senha</label>
                            <input type="password" placeholder="••••••••" className="input" />
                        </div>
                        <button className="btn-secondary w-full justify-center py-2">Atualizar Senha</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
