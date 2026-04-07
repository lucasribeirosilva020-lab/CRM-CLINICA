'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getAvatarUrl } from '@/lib/utils';
import {
    LayoutDashboard, MessageSquare, Columns, Users,
    Calendar, Bell, Settings, ChevronLeft, Wifi, WifiOff,
    LogOut, Activity, FileText, BarChart2, HelpCircle
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/conversas', label: 'Conversas', icon: MessageSquare },
    {
        href: '/kanban',
        label: 'Kanban',
        icon: Columns,
        sub: [
            { href: '/kanban/atendimento', label: 'Atendimento' },
            { href: '/kanban/vendas', label: 'Vendas' },
            { href: '/kanban/ltvs', label: 'Leads Perdidos' },
        ],
    },
    {
        href: '/clientes',
        label: 'Clientes',
        icon: Users,
        sub: [
            { href: '/clientes/ativos', label: 'Ativos' },
            { href: '/clientes/inativos', label: 'Inativos' },
        ],
    },
    { href: '/agendamentos', label: 'Copys', icon: FileText },
    {
        href: '/relatorios',
        label: 'Relatórios',
        icon: BarChart2,
        sub: [
            { href: '/relatorios/sla', label: 'SLA Atendimento' },
        ],
    },
    { href: '/notificacoes', label: 'Notificações', icon: Bell },
    {
        href: '/configuracoes',
        label: 'Configurações',
        icon: Settings,
        sub: [
            { href: '/configuracoes/perfil', label: 'Meu Perfil' },
            { href: '/configuracoes/clinica', label: 'Minha Clínica' },
            { href: '/configuracoes/equipe', label: 'Equipe' },
            { href: '/configuracoes/whatsapp', label: 'WhatsApp' },
        ]
    },
    { href: '/guia', label: 'Guia de Uso', icon: HelpCircle },
];

// Items visíveis por perfil
const perfilMenu: Record<string, string[]> = {
    ADMIN: ['/dashboard', '/conversas', '/kanban', '/clientes', '/agendamentos', '/relatorios', '/notificacoes', '/configuracoes', '/guia'],
    VENDEDOR: ['/dashboard', '/conversas', '/kanban', '/clientes', '/agendamentos', '/relatorios', '/notificacoes', '/guia'],
    ATENDENTE: ['/dashboard', '/conversas', '/kanban', '/clientes', '/notificacoes', '/guia'],
};

interface SidebarProps {
    whatsappOnline?: boolean;
}

export default function Sidebar({ whatsappOnline = false }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { usuario, logout, isAdmin, isVendedor, isAtendente } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const allowed = usuario ? perfilMenu[usuario.perfil] : [];

    const visibleItems = menuItems.filter((item) =>
        allowed.some((a) => item.href.startsWith(a))
    );

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 sticky top-0 z-30',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 border-b border-gray-200">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-400 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-lg font-black text-gray-900 tracking-tight">Clinify</p>
                        <p className="text-[10px] text-primary/80 font-bold uppercase tracking-widest">{usuario?.clinica.nome}</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto text-gray-400 hover:text-primary transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                >
                    <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
                </button>
            </div>

            {/* Status WhatsApp */}
            {!collapsed && (
                <div className="mx-4 mt-4 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                    {whatsappOnline ? (
                        <>
                            <Wifi className="w-4 h-4 text-success" />
                            <span className="text-xs font-bold text-gray-700 italic">Rede Ativa</span>
                            <span className="ml-auto w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-400">Desconectado</span>
                        </>
                    )}
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {visibleItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const hasSubMenu = item.sub && item.sub.length > 0;
                    const isExpanded = expandedMenu === item.href;

                    const handleClick = (e: React.MouseEvent) => {
                        e.preventDefault();
                        if (hasSubMenu) {
                            setExpandedMenu(isExpanded ? null : item.href);
                        } else {
                            router.push(item.href);
                        }
                    };

                    return (
                        <div key={item.href}>
                            <button
                                onClick={handleClick}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 text-left',
                                    isActive
                                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                                )}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                {!collapsed && <span className="flex-1">{item.label}</span>}
                                {!collapsed && hasSubMenu && (
                                    <ChevronLeft
                                        className={cn('w-3 h-3 transition-transform', isExpanded ? '-rotate-90' : 'rotate-180')}
                                    />
                                )}
                            </button>

                            {/* Sub items */}
                            {!collapsed && hasSubMenu && isExpanded && (
                                <div className="ml-4 mt-1 space-y-0.5">
                                    {item.sub!.filter((sub) => {
                                        if (isAdmin) return true;
                                        if (isVendedor && sub.href === '/kanban/atendimento') return false;
                                        if (isAtendente && sub.href === '/kanban/vendas') return false;
                                        return true;
                                    }).map((sub) => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all',
                                                pathname === sub.href
                                                    ? 'text-primary bg-primary/5'
                                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                                            )}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User profile */}
            <div className="border-t border-gray-200 p-4 bg-gray-50/50">
                <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                    <img
                        src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'C')}
                        alt={usuario?.nome}
                        className="w-10 h-10 rounded-xl border-2 border-gray-200 flex-shrink-0 object-cover"
                    />
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{usuario?.nome}</p>
                            <p className="text-[10px] text-primary/70 font-black uppercase tracking-tighter truncate">{usuario?.perfil}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={logout}
                            title="Sair"
                            className="text-gray-400 hover:text-error transition-colors p-1.5 hover:bg-error/5 rounded-lg"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
