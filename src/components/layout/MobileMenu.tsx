'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    X, Settings, LogOut, MessageSquare, BarChart2, 
    HelpCircle, Bell, FileText, User, Shield, Phone, Activity
} from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
    const { usuario, logout, isAdmin, isVendedor, isAtendente } = useAuth();
    const pathname = usePathname();

    if (!isOpen) return null;

    const menuSections = [
        {
            title: 'Geral',
            items: [
                { href: '/agendamentos', label: 'Copys (Agendamentos)', icon: FileText, show: true },
                { href: '/relatorios/sla', label: 'Relatórios SLA', icon: BarChart2, show: isAdmin || isVendedor },
                { href: '/notificacoes', label: 'Notificações', icon: Bell, show: true },
                { href: '/guia', label: 'Guia de Uso', icon: HelpCircle, show: true },
            ]
        },
        {
            title: 'Configurações',
            items: [
                { href: '/configuracoes/perfil', label: 'Meu Perfil', icon: User, show: true },
                { href: '/configuracoes/clinica', label: 'Minha Clínica', icon: Activity, show: isAdmin },
                { href: '/configuracoes/equipe', label: 'Equipe', icon: Shield, show: isAdmin },
                { href: '/configuracoes/whatsapp', label: 'WhatsApp', icon: Phone, show: isAdmin },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex flex-col md:hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
                onClick={onClose}
            />

            {/* Content Sidebar Right */}
            <div className="relative ml-auto h-full w-[80%] max-w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                    <div className="flex items-center gap-3">
                        <img 
                            src={usuario?.avatar || getAvatarUrl(usuario?.nome || 'U')} 
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                            alt=""
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{usuario?.nome?.split(' ')[0]}</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest">{usuario?.perfil}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Scrollable */}
                <div className="flex-1 overflow-y-auto py-2 px-4 space-y-6">
                    {menuSections.map((section, idx) => {
                        const visibleItems = section.items.filter(i => i.show);
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx}>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-2">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {visibleItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onClose}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all",
                                                    isActive 
                                                        ? "bg-primary/10 text-primary border border-primary/10 shadow-sm"
                                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                                )}
                                            >
                                                <Icon className="w-4.5 h-4.5" />
                                                <span>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button 
                        onClick={() => {
                            onClose();
                            logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-error/10 text-error font-bold rounded-xl hover:bg-error/20 transition-all active:scale-95 border border-error/10"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair da Conta
                    </button>
                    <p className="text-[10px] text-center text-gray-400 font-medium mt-3 italic">
                        Clinify v1.2.0 • Prograde
                    </p>
                </div>
            </div>
        </div>
    );
}
