'use client';

import Header from '@/components/layout/Header';
import { Settings, User, Bell, Shield, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ConfiguracoesPage() {
    const { isAdmin } = useAuth();

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <Header title="Configurações" subtitle="Gerenciamento do sistema" />

            <div className="p-4 max-w-2xl mx-auto w-full space-y-4">
                {/* Minha Conta */}
                <div className="card space-y-2">
                    <h2 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-primary" /> Minha Conta
                    </h2>
                    <Link href="/configuracoes/perfil" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary transition-all group">
                        <div>
                            <p className="text-sm font-semibold text-text group-hover:text-primary">Perfil e Senha</p>
                            <p className="text-xs text-text-muted">Atualize seus dados pessoais e troque sua senha</p>
                        </div>
                    </Link>
                </div>

                {/* Sistema */}
                {isAdmin && (
                    <div className="card space-y-2">
                        <h2 className="text-sm font-bold text-text flex items-center gap-2 mb-3">
                            <Settings className="w-4 h-4 text-primary" /> Sistema
                        </h2>
                        <Link href="/configuracoes/whatsapp" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary transition-all group">
                            <div>
                                <p className="text-sm font-semibold text-text group-hover:text-primary">WhatsApp Conexão</p>
                                <p className="text-xs text-text-muted">Gerencie o QR Code e status do WhatsApp</p>
                            </div>
                            <Smartphone className="w-5 h-5 text-text-light group-hover:text-primary transition-colors" />
                        </Link>
                        <Link href="/configuracoes/usuarios" className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary transition-all group">
                            <div>
                                <p className="text-sm font-semibold text-text group-hover:text-primary">Usuários e Permissões</p>
                                <p className="text-xs text-text-muted">Adicione ou remova atendentes e vendedores</p>
                            </div>
                            <Shield className="w-5 h-5 text-text-light group-hover:text-primary transition-colors" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
