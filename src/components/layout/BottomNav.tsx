'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Columns, Users, BarChart2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard, perfis: ['ADMIN', 'VENDEDOR', 'ATENDENTE'] },
    { href: '/conversas', label: 'Conversas', icon: MessageSquare, perfis: ['ADMIN', 'VENDEDOR', 'ATENDENTE'] },
    { href: '/kanban/atendimento', label: 'Kanban', icon: Columns, perfis: ['ADMIN', 'VENDEDOR', 'ATENDENTE'] },
    { href: '/clientes/ativos', label: 'Clientes', icon: Users, perfis: ['ADMIN', 'VENDEDOR', 'ATENDENTE'] },
    { href: '/relatorios/sla', label: 'SLA', icon: BarChart2, perfis: ['ADMIN', 'VENDEDOR'] },
    { href: '/guia', label: 'Guia', icon: HelpCircle, perfis: ['ADMIN', 'VENDEDOR', 'ATENDENTE'] },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { usuario } = useAuth();
    const perfil = usuario?.perfil || 'ATENDENTE';

    const visibleItems = NAV_ITEMS.filter((i) => i.perfis.includes(perfil));

    return (
        <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30 flex items-stretch">
            {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href.split('/').slice(0, 2).join('/'));

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 min-h-[56px]',
                            isActive ? 'text-primary' : 'text-text-muted'
                        )}
                    >
                        <div className={cn(
                            'p-1.5 rounded-lg transition-all',
                            isActive ? 'bg-secondary' : 'bg-transparent'
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
