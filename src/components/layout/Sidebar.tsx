'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
            { href: '/kanban/ltvs', label: 'LTVs' },
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
    const { usuario, logout, isAdmin } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const allowed = usuario ? perfilMenu[usuario.perfil] : [];

    const visibleItems = menuItems.filter((item) =>
        allowed.some((a) => item.href.startsWith(a))
    );

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen bg-white border-r border-border transition-all duration-300 sticky top-0 z-30',
                collapsed ? 'w-16' : 'w-60'
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-white" />
                </div>
                {!collapsed && (
                    <div>
                        <p className="text-sm font-bold text-text leading-tight">CRM Clínica</p>
                        <p className="text-[10px] text-text-muted leading-tight">{usuario?.clinica.nome}</p>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="ml-auto text-text-muted hover:text-primary transition-colors"
                >
                    <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
                </button>
            </div>

            {/* Status WhatsApp */}
            {!collapsed && (
                <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-secondary flex items-center gap-2">
                    {whatsappOnline ? (
                        <>
                            <Wifi className="w-3.5 h-3.5 text-success" />
                            <span className="text-xs font-medium text-success">WhatsApp Conectado</span>
                            <span className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
                        </>
                    ) : (
                        <>
                            <WifiOff className="w-3.5 h-3.5 text-error" />
                            <span className="text-xs font-medium text-error">Desconectado</span>
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

                    return (
                        <div key={item.href}>
                            <button
                                onClick={() => {
                                    if (hasSubMenu) {
                                        setExpandedMenu(isExpanded ? null : item.href);
                                    } else {
                                        window.location.href = item.href;
                                    }
                                }}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left',
                                    isActive
                                        ? 'bg-secondary text-primary'
                                        : 'text-text-muted hover:bg-gray-50 hover:text-text'
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
                                    {item.sub!.map((sub) => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            className={cn(
                                                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                                                pathname === sub.href
                                                    ? 'text-primary bg-secondary'
                                                    : 'text-text-muted hover:text-text hover:bg-gray-50'
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
            <div className="border-t border-border p-3">
                <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
                    <img
                        src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'U')}
                        alt={usuario?.nome}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                    />
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text truncate">{usuario?.nome}</p>
                            <p className="text-[10px] text-text-muted truncate">{usuario?.perfil}</p>
                        </div>
                    )}
                    {!collapsed && (
                        <button
                            onClick={logout}
                            title="Sair"
                            className="text-text-muted hover:text-error transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </aside>
    );
}
