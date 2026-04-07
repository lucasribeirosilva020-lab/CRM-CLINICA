'use client';

import { Bell, Search, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarUrl } from '@/lib/utils';
import Link from 'next/link';

interface HeaderProps {
    title: string;
    subtitle?: string;
    back?: string;
    actions?: React.ReactNode;
    notifCount?: number;
}

export default function Header({ title, subtitle, back, actions, notifCount = 0 }: HeaderProps) {
    const { usuario } = useAuth();

    return (
        <header className="glass px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
            {back && (
                <Link href={back} className="text-gray-400 hover:text-primary transition-all p-1.5 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            )}

            <div className="flex-1 min-w-0">
                <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight truncate">{title}</h1>
                {subtitle && <p className="text-xs font-bold text-primary/70 uppercase tracking-widest truncate">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
                {actions}

                <Link
                    href="/notificacoes"
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all duration-300"
                >
                    <Bell className="w-5 h-5 text-gray-400" />
                    {notifCount > 0 && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-primary/30">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </Link>

                <Link href="/configuracoes/perfil" className="flex-shrink-0 group">
                    <img
                        src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'C', 40)}
                        alt={usuario?.nome}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-gray-200 group-hover:border-primary transition-all duration-300 shadow-sm"
                    />
                </Link>
            </div>
        </header>
    );
}
