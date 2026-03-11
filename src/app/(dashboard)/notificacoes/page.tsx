'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Bell, CheckCircle, Info, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn, minutosDesde } from '@/lib/utils';
import Link from 'next/link';

// Mock data
const NOTIFICACOES_MOCK = [
    { id: '1', tipo: 'info', titulo: 'Nova mensagem', mensagem: 'Você tem uma nova mensagem de Julia Pereira.', lida: false, tempo: new Date(Date.now() - 5 * 60000).toISOString(), link: '/conversas' },
    { id: '2', tipo: 'warning', titulo: 'SLA Atrasado', mensagem: 'A conversa com Marcos Oliveira está aguardando há mais de 30 minutos.', lida: false, tempo: new Date(Date.now() - 35 * 60000).toISOString(), link: '/conversas' },
    { id: '3', tipo: 'success', titulo: 'Transferência', mensagem: 'Carlos Vendedor transferiu um lead para você.', lida: true, tempo: new Date(Date.now() - 2 * 3600000).toISOString(), link: '/kanban/vendas' },
];

export default function NotificacoesPage() {
    const [notificacoes, setNotificacoes] = useState(NOTIFICACOES_MOCK);
    const naoLidas = notificacoes.filter(n => !n.lida).length;

    const marcarComoLida = (id: string) => {
        setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    };

    const marcarTodas = () => {
        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <Header
                title="Notificações"
                subtitle={`${naoLidas} não lidas`}
                actions={
                    naoLidas > 0 && (
                        <button onClick={marcarTodas} className="btn-ghost py-1.5 px-3 text-xs">
                            Marcar todas como lidas
                        </button>
                    )
                }
            />

            <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-3">
                {notificacoes.map((notif) => (
                    <div
                        key={notif.id}
                        className={cn(
                            'card transition-all relative overflow-hidden',
                            !notif.lida ? 'bg-secondary/50 border-primary/20' : 'opacity-70',
                            notif.tipo === 'warning' && !notif.lida && 'bg-warning/10 border-warning/30'
                        )}
                        onClick={() => marcarComoLida(notif.id)}
                    >
                        {/* Indicador visual de nova */}
                        {!notif.lida && <div className="absolute top-0 left-0 w-1 h-full bg-primary" />}
                        {notif.tipo === 'warning' && !notif.lida && <div className="absolute top-0 left-0 w-1 h-full bg-warning" />}

                        <div className="flex items-start gap-4">
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                                notif.tipo === 'info' ? 'bg-primary/10 text-primary' :
                                    notif.tipo === 'warning' ? 'bg-warning/10 text-warning' :
                                        'bg-success/10 text-success'
                            )}>
                                {notif.tipo === 'info' && <MessageSquare className="w-5 h-5" />}
                                {notif.tipo === 'warning' && <AlertTriangle className="w-5 h-5" />}
                                {notif.tipo === 'success' && <CheckCircle className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className={cn('text-sm font-bold truncate', notif.lida ? 'text-text-muted' : 'text-text')}>
                                        {notif.titulo}
                                    </p>
                                    <span className="text-[10px] text-text-light flex-shrink-0">
                                        {Math.floor(minutosDesde(notif.tempo) / 60)}h atrás
                                    </span>
                                </div>
                                <p className="text-sm text-text-muted leading-relaxed mb-3">
                                    {notif.mensagem}
                                </p>

                                {notif.link && (
                                    <Link href={notif.link} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                                        Acessar <span aria-hidden="true">&rarr;</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {notificacoes.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-text-light" />
                        </div>
                        <p className="text-base font-semibold text-text mb-1">Nenhuma notificação</p>
                        <p className="text-sm text-text-muted">Você está em dia com tudo!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
