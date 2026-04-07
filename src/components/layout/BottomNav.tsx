'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Columns, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import MobileMenu from './MobileMenu';

const MAIN_NAV = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/conversas', label: 'Conversas', icon: MessageSquare },
    { href: '/kanban/atendimento', label: 'Kanban', icon: Columns },
    { href: '/clientes/ativos', label: 'Clientes', icon: Users },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { usuario } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!usuario) return null;

    return (
        <>
            <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-50 flex items-stretch shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
                {MAIN_NAV.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href.split('/').slice(0, 2).join('/'));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-300 min-h-[64px]',
                                isActive ? 'text-primary' : 'text-gray-400'
                            )}
                        >
                            <div className={cn(
                                'p-2 rounded-xl transition-all duration-300',
                                isActive ? 'bg-primary/10 shadow-sm' : 'bg-transparent'
                            )}>
                                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "opacity-100" : "opacity-60")}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* Botão Mais */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className={cn(
                        'flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all duration-300 min-h-[64px]',
                        isMenuOpen ? 'text-primary' : 'text-gray-400'
                    )}
                >
                    <div className={cn(
                        'p-2 rounded-xl transition-all duration-300',
                        isMenuOpen ? 'bg-primary/10 shadow-sm' : 'bg-transparent'
                    )}>
                        <MoreHorizontal className={cn("w-5 h-5", isMenuOpen && "stroke-[2.5px]")} />
                    </div>
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isMenuOpen ? "opacity-100" : "opacity-60")}>
                        Mais
                    </span>
                </button>
            </nav>

            <MobileMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
            />
        </>
    );
}
