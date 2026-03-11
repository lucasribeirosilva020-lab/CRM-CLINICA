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
        <header className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
            {back && (
                <Link href={back} className="text-text-muted hover:text-primary transition-colors mr-1">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
            )}

            <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-text leading-tight truncate">{title}</h1>
                {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-2">
                {actions}

                <Link
                    href="/notificacoes"
                    className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
                >
                    <Bell className="w-4.5 h-4.5 text-text-muted" />
                    {notifCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-error text-white text-[9px] font-bold flex items-center justify-center">
                            {notifCount > 9 ? '9+' : notifCount}
                        </span>
                    )}
                </Link>

                <Link href="/configuracoes/perfil" className="flex-shrink-0">
                    <img
                        src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'U', 36)}
                        alt={usuario?.nome}
                        className="w-8 h-8 rounded-full object-cover border-2 border-border"
                    />
                </Link>
            </div>
        </header>
    );
}
