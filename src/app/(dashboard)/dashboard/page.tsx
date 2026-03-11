'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import {
    Users, MessageSquare, TrendingUp, Clock, CheckCircle, Target,
    ArrowUp, ArrowDown, MoreHorizontal, Wifi, WifiOff, Activity,
} from 'lucide-react';
import { cn, formatarMoeda } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

const COLORS = ['#1A73E8', '#34A853', '#FBBC04', '#EA4335', '#6B7280', '#9333EA'];

interface MetricCardProps {
    titulo: string;
    valor: string;
    subtitulo?: string;
    icon: React.ReactNode;
    cor?: string;
    trend?: { valor: string; up: boolean };
}

function MetricCard({ titulo, valor, subtitulo, icon, cor = 'blue', trend }: MetricCardProps) {
    const cores: Record<string, string> = {
        blue: 'bg-secondary text-primary',
        green: 'bg-success/10 text-success',
        yellow: 'bg-warning/10 text-warning',
        red: 'bg-error/10 text-error',
        purple: 'bg-purple-50 text-purple-600',
    };

    return (
        <div className="card flex items-start gap-3 sm:gap-4 p-3 sm:p-4">
            <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0', cores[cor])}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-text-muted mb-0.5 truncate" title={titulo}>{titulo}</p>
                <p className="text-base sm:text-xl font-bold text-text leading-tight truncate" title={valor}>{valor}</p>
                {subtitulo && <p className="text-[9px] sm:text-xs text-text-muted mt-0.5 truncate" title={subtitulo}>{subtitulo}</p>}
                {trend && (
                    <div className={cn('flex items-center gap-1 mt-1 text-[9px] sm:text-xs font-medium truncate', trend.up ? 'text-success' : 'text-error')}>
                        {trend.up ? <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                        {trend.valor} vs mês
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { usuario } = useAuth();
    const [whatsappOnline] = useState(false);
    const [modalEditOpen, setModalEditOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Estados para dados reais do banco
    const [stats, setStats] = useState<any>(null);
    const [metaGlobal, setMetaGlobal] = useState(100000);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/stats');
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
                if (json.data.metrics.metaGlobal) {
                    setMetaGlobal(json.data.metrics.metaGlobal);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const salvarMetas = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const valorMeta = Number(formData.get('metaGlobal'));

        try {
            const res = await fetch('/api/dashboard/metas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valorMeta })
            });

            if (res.ok) {
                setMetaGlobal(valorMeta);
                setModalEditOpen(false);
                fetchStats(); // Atualizar progresso
            }
        } catch (err) {
            console.error('Erro ao salvar meta:', err);
        }
    };

    const metrics = stats?.metrics || {
        totalVendido: 0,
        novosLeads: 0,
        conversoes: 0,
        taxaConversao: 0,
        ticketMedio: 0
    };

    const vendasTotal = metrics.totalVendido;
    const porcentagemMeta = Math.min(Math.round((vendasTotal / metaGlobal) * 100) || 0, 100);

    return (
        <div className="animate-fade-in relative z-0">
            <Header
                title="Dashboard"
                subtitle={`Bem-vindo, ${usuario?.nome?.split(' ')[0]}! 👋`}
                notifCount={3}
                actions={
                    <button
                        onClick={() => setModalEditOpen(!modalEditOpen)}
                        className="btn-outline py-1.5 px-3 text-xs flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Ajustar Metas</span>
                    </button>
                }
            />

            <div className="p-4 space-y-5 max-w-7xl mx-auto">

                {/* Status WhatsApp mobile */}
                <div className={cn(
                    'md:hidden flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium',
                    whatsappOnline
                        ? 'bg-success/10 border-success/20 text-success'
                        : 'bg-error/10 border-error/20 text-error'
                )}>
                    {whatsappOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    WhatsApp {whatsappOnline ? 'Conectado' : 'Desconectado'}
                    {!whatsappOnline && (
                        <a href="/configuracoes/whatsapp" className="ml-auto text-xs underline">Conectar</a>
                    )}
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
                    <MetricCard
                        titulo="Total Vendido"
                        valor={formatarMoeda(vendasTotal)}
                        icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="blue"
                    />
                    <MetricCard
                        titulo="Meta do Mês"
                        valor={`${porcentagemMeta}%`}
                        subtitulo={`${formatarMoeda(vendasTotal)} / ${formatarMoeda(metaGlobal)}`}
                        icon={<Target className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="yellow"
                    />
                    <MetricCard
                        titulo="Ticket Médio"
                        valor={formatarMoeda(metrics.ticketMedio)}
                        icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="purple"
                    />
                    <MetricCard
                        titulo="Novos Leads"
                        valor={String(metrics.novosLeads)}
                        subtitulo="Este mês"
                        icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="blue"
                    />
                    <MetricCard
                        titulo="Conversões"
                        valor={String(metrics.conversoes)}
                        subtitulo={`${metrics.taxaConversao}% de taxa`}
                        icon={<CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="green"
                    />
                    <MetricCard
                        titulo="Tempo Médio"
                        valor="0h 00min"
                        subtitulo="Sem dados"
                        icon={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />}
                        cor="yellow"
                    />
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Vendas por semana */}
                    <div className="card lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-text">Vendas por Semana</h3>
                                <p className="text-xs text-text-muted">Mês atual vs anterior</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                                    <span className="text-text-muted">Atual</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-primary/30" />
                                    <span className="text-text-muted">Anterior</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            {stats?.vendasSemanais?.length ? (
                                <BarChart data={stats.vendasSemanais} barGap={4}>
                                    <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(v: number) => [formatarMoeda(v), '']}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '12px' }}
                                    />
                                    <Bar dataKey="anterior" fill="#E8F0FE" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="atual" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-text-light">
                                    Sem dados históricos suficientes para comparar.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Pizza */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-text mb-1">Leads por Status</h3>
                        <p className="text-xs text-text-muted mb-4">Distribuição no kanban</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={stats?.leadsPorStatus?.length ? stats.leadsPorStatus : [{ nome: 'Sem Dados', valor: 1 }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="valor"
                                >
                                    {(stats?.leadsPorStatus?.length ? stats.leadsPorStatus : [{ nome: 'Sem Dados' }]).map((entry: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => [v, 'leads']} contentStyle={{ borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {stats?.leadsPorStatus?.map((d: any, i: number) => (
                                <div key={d.nome} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-text-muted flex-1 capitalize">{d.nome.replace('_', ' ')}</span>
                                    <span className="font-semibold text-text">{d.valor}</span>
                                </div>
                            ))}
                            {(!stats?.leadsPorStatus || stats.leadsPorStatus.length === 0) && (
                                <p className="text-[10px] text-text-light text-center">Nenhum lead encontrado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Receita 6 meses + Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card lg:col-span-2">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-text">Evolução de Receita</h3>
                            <p className="text-xs text-text-muted">Últimos 6 meses</p>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            {stats?.receitaMensal?.length ? (
                                <LineChart data={stats.receitaMensal}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v: number) => [formatarMoeda(v), 'Receita']} contentStyle={{ borderRadius: '12px', border: '1px solid #E0E0E0', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="receita" stroke="#1A73E8" strokeWidth={2.5} dot={{ fill: '#1A73E8', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-text-light">
                                    Aguardando as primeiras vendas para gerar evolução.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Ranking vendedores */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-text mb-4">Ranking de Vendedores</h3>
                        <div className="space-y-4">
                            {stats?.rankingVendedores?.map((v: any, i: number) => {
                                const metaVendedor = metaGlobal / (stats.rankingVendedores.length || 1); // Simplificando meta
                                const pct = metaVendedor > 0 ? Math.round((v.vendas / metaVendedor) * 100) : 0;
                                return (
                                    <div key={v.nome}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-text-muted w-4">#{i + 1}</span>
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                                style={{ background: '#1A73E8' }}
                                            >
                                                {v.nome.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-text truncate">{v.nome.split(' ')[0]}</p>
                                                <p className="text-[10px] text-text-muted">{v.conversoes} conversões</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-text">{pct}%</p>
                                                <p className="text-[10px] text-text-muted">da meta</p>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 ml-9">
                                            <div
                                                className="h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 80 ? '#34A853' : pct >= 50 ? '#FBBC04' : '#EA4335' }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-text-muted ml-9 mt-0.5">{formatarMoeda(v.vendas)} / {formatarMoeda(metaVendedor)}</p>
                                    </div>
                                );
                            })}
                            {(!stats?.rankingVendedores || stats.rankingVendedores.length === 0) && (
                                <p className="text-xs text-text-light text-center py-4">Nenhum vendedor cadastrado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Atividade recente */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-text">Atividade Recente</h3>
                        <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
                    </div>
                    <div className="space-y-3">
                        <p className="text-xs text-text-light text-center py-2">Nenhuma atividade recente encontrada para sua clínica.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Edição de Metas */}
            {modalEditOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in text-text">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
                        <h2 className="text-xl font-bold mb-1">Ajustar Metas e Números</h2>
                        <p className="text-sm text-text-muted mb-6">Edite os valores principais para os relatórios do dashboard.</p>

                        <form onSubmit={salvarMetas} className="space-y-5">
                            <div>
                                <label className="label text-xs">Meta Global da Clínica (R$)</label>
                                <input
                                    name="metaGlobal"
                                    type="number"
                                    defaultValue={metaGlobal}
                                    className="input text-base"
                                    required
                                />
                            </div>

                            <div className="pt-2 border-t border-border space-y-3">
                                <h3 className="text-sm font-semibold mb-2">Metas por Vendedor (R$)</h3>
                                {stats?.rankingVendedores?.map((v: any, index: number) => (
                                    <div key={v.nome} className="flex items-center gap-3">
                                        <label className="text-xs font-medium w-28 truncate">{v.nome}</label>
                                        <input
                                            name={`metaVendedor_${index}`}
                                            type="number"
                                            defaultValue={metaGlobal / (stats.rankingVendedores.length || 1)}
                                            className="input py-1.5 px-3 text-sm flex-1"
                                            required
                                        />
                                    </div>
                                ))}
                                {(!stats?.rankingVendedores || stats.rankingVendedores.length === 0) && (
                                    <p className="text-[10px] text-text-light italic text-center">Nenhum vendedor para atribuir metas individuais.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-border mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalEditOpen(false)}
                                    className="btn-outline flex-1 justify-center py-2"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary flex-1 justify-center py-2">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
