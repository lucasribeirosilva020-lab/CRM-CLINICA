'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UsuarioAuth {
    id: string;
    nome: string;
    email: string;
    perfil: 'ADMIN' | 'VENDEDOR' | 'ATENDENTE';
    avatar?: string | null;
    clinica: { id: string; nome: string };
}

interface AuthContextType {
    usuario: UsuarioAuth | null;
    loading: boolean;
    login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    isVendedor: boolean;
    isAtendente: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
    const [loading, setLoading] = useState(true);

    // Verificar sessão ao carregar
    useEffect(() => {
        console.log('[AuthContext] Iniciando verificação de sessão...');
        const storedUser = localStorage.getItem('crm_user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                console.log('[AuthContext] Usuário encontrado no localStorage:', parsed.nome);
                setUsuario(parsed);
            } catch (err) {
                console.error('[AuthContext] Erro ao parsear usuário:', err);
                localStorage.removeItem('crm_user');
            }
        } else {
            console.log('[AuthContext] Nenhum usuário no localStorage');
        }

        // Failsafe: garante que o loading termine mesmo se algo der errado
        const timer = setTimeout(() => {
            console.log('[AuthContext] Finalizando loading');
            setLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const login = useCallback(async (email: string, senha: string) => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });

            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Erro ao fazer login' };
            }

            const { usuario: u, accessToken } = data.data;
            setUsuario(u);
            localStorage.setItem('crm_user', JSON.stringify(u));
            localStorage.setItem('crm_token', accessToken);

            return { success: true };
        } catch {
            return { success: false, error: 'Erro de conexão' };
        }
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUsuario(null);
        localStorage.removeItem('crm_user');
        localStorage.removeItem('crm_token');
        window.location.href = '/login';
    }, []);

    return (
        <AuthContext.Provider
            value={{
                usuario,
                loading,
                login,
                logout,
                isAdmin: usuario?.perfil === 'ADMIN',
                isVendedor: usuario?.perfil === 'VENDEDOR' || usuario?.perfil === 'ADMIN',
                isAtendente: usuario?.perfil === 'ATENDENTE' || usuario?.perfil === 'ADMIN',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
    return ctx;
}
