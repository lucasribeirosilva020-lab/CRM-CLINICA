'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { usuario, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('[DashboardLayout] State:', { loading, hasUsuario: !!usuario });
        }

        if (!loading && !usuario) {
            router.push('/login');
        }
    }, [usuario, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-sm text-text-muted font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!usuario) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    {children}
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
