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

const COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2'];

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
        blue: 'bg-primary/10 text-primary',
        green: 'bg-emerald-50 text-emerald-600',
        yellow: 'bg-amber-50 text-amber-600',
        red: 'bg-error/10 text-error',
        purple: 'bg-primary/10 text-primary',
    };

    return (
        <div className="card flex items-start gap-3 sm:gap-4 p-3 sm:p-4">
            <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0', cores[cor])}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 mb-0.5 truncate uppercase tracking-widest" title={titulo}>{titulo}</p>
                <p className="text-base sm:text-xl font-black text-gray-900 leading-tight truncate" title={valor}>{valor}</p>
                {subtitulo && <p className="text-[9px] sm:text-xs font-medium text-gray-500 mt-0.5 truncate" title={subtitulo}>{subtitulo}</p>}
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
    const { usuario, isAdmin } = useAuth();
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

        const metasIndividuais = stats?.rankingVendedores?.map((v: any) => ({
            vendedorId: v.id,
            valorMeta: Number(formData.get(`metaVendedor_${v.id}`)) || 0
        })) || [];

        try {
            const res = await fetch('/api/dashboard/metas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ valorMeta, metasIndividuais })
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
                actions={isAdmin && (
                    <button
                        onClick={() => setModalEditOpen(!modalEditOpen)}
                        className="btn-outline py-1.5 px-3 text-xs flex items-center gap-2"
                    >
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Ajustar Metas</span>
                    </button>
                )}
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

                {/* Mtricas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-3">
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
                                <h3 className="text-sm font-bold text-gray-900">Vendas por Semana</h3>
                                <p className="text-xs text-gray-500">Mês atual vs anterior</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                                    <span className="text-gray-500">Atual</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-[#F5C469]" />
                                    <span className="text-gray-500">Anterior</span>
                                </div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            {stats?.vendasSemanais?.length ? (
                                <BarChart data={stats.vendasSemanais} barGap={4}>
                                    <XAxis dataKey="semana" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(v: number) => [formatarMoeda(v), '']}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', background: '#fff' }}
                                    />
                                    <Bar dataKey="anterior" fill="#F5C469" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="atual" fill="#1B4332" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                    Sem dados históricos suficientes para comparar.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Pizza */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">Leads por Status</h3>
                        <p className="text-xs text-gray-500 mb-4">Distribuição no kanban</p>
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
                                <Tooltip formatter={(v: number) => [v, 'leads']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', background: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {stats?.leadsPorStatus?.map((d: any, i: number) => (
                                <div key={d.nome} className="flex items-center gap-2 text-xs">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                    <span className="text-gray-500 flex-1 capitalize">{d.nome.replace('_', ' ')}</span>
                                    <span className="font-semibold text-gray-900">{d.valor}</span>
                                </div>
                            ))}
                            {(!stats?.leadsPorStatus || stats.leadsPorStatus.length === 0) && (
                                <p className="text-[10px] text-gray-400 text-center">Nenhum lead encontrado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Receita 6 meses + Ranking */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card lg:col-span-2">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Evolução de Receita</h3>
                            <p className="text-xs text-gray-500">Últimos 6 meses</p>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            {stats?.historicoMensal?.length ? (
                                <LineChart data={stats.historicoMensal}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v: number) => [formatarMoeda(v), 'Receita']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', background: '#fff' }} />
                                    <Line type="monotone" dataKey="receita" stroke="#1B4332" strokeWidth={3} dot={{ fill: '#1B4332', r: 5 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                    Aguardando as primeiras vendas para gerar evolução.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Ranking vendedores */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Ranking de Vendedores</h3>
                        <div className="space-y-4">
                            {stats?.rankingVendedores?.map((v: any, i: number) => {
                                const metaVendedor = v.meta || 0;
                                const pct = metaVendedor > 0 ? Math.round((v.vendas / metaVendedor) * 100) : 0;
                                return (
                                    <div key={v.id || v.nome} className="pl-1 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-gray-400 w-4">#{i + 1}</span>
                                            <div
                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0 bg-primary shadow-lg shadow-primary/20"
                                            >
                                                {v.nome.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-900 truncate">{v.nome.split(' ')[0]}</p>
                                                <p className="text-[10px] text-gray-500">{v.conversoes} conversões</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-900">{pct}%</p>
                                                <p className="text-[10px] text-gray-500">da meta</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-100 rounded-full h-2 ml-[3.2rem] overflow-hidden flex items-stretch">
                                            <div
                                                className="bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${Math.min(pct, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-500 ml-[3.2rem] mt-1 font-medium">{formatarMoeda(v.vendas)} / {formatarMoeda(metaVendedor)}</p>
                                    </div>
                                );
                            })}
                            {(!stats?.rankingVendedores || stats.rankingVendedores.length === 0) && (
                                <p className="text-xs text-gray-400 text-center py-4">Nenhum vendedor cadastrado</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Previsibilidade e Atividade */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Previsibilidade Leads */}
                    <div className="card">
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Previsibilidade de Leads</h3>
                            <p className="text-xs text-gray-500">Volume de entrada mês a mês</p>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            {stats?.historicoMensal?.length ? (
                                <LineChart data={stats.historicoMensal}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                                    <Tooltip formatter={(v: number) => [v, 'Leads']} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px', background: '#fff' }} />
                                    <Line type="monotone" dataKey="leads" stroke="#F5B041" strokeWidth={3} dot={{ fill: '#F5B041', r: 5 }} activeDot={{ r: 7 }} />
                                </LineChart>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-gray-400">
                                    Aguardando o registro de novos leads.
                                </div>
                            )}
                        </ResponsiveContainer>
                    </div>

                    {/* Atividade recente */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Atividade Recente</h3>
                            <button className="text-xs text-primary font-medium hover:underline">Ver todas</button>
                        </div>
                        <div className="space-y-4">
                            {stats?.recentActivity?.length ? (
                                stats.recentActivity.map((act: any) => (
                                    <div key={act.id} className="flex gap-3 items-start animate-fade-in">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                            act.tipo === 'venda' ? "bg-emerald-50 text-emerald-600" : 
                                            act.tipo === 'lead' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                                        )}>
                                            {act.tipo === 'venda' ? <TrendingUp className="w-4 h-4" /> : 
                                             act.tipo === 'lead' ? <Users className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 max-w-full overflow-hidden">
                                                <p className="text-xs font-bold text-gray-900 truncate">{act.titulo}</p>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                    {new Date(act.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                {act.descricao}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 text-center py-8">Nenhuma atividade recente encontrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Edição de Metas */}
            {modalEditOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 animate-fade-in text-gray-900">
                <div className="bg-white p-8 rounded-[32px] w-full max-w-md shadow-2xl relative border border-gray-200">
                        <h2 className="text-xl font-bold mb-1">Ajustar Metas e Números</h2>
                        <p className="text-sm text-gray-500 mb-6">Edite os valores principais para os relatórios do dashboard.</p>

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

                            <div className="pt-2 border-t border-gray-200 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                <h3 className="text-sm font-semibold mb-2 sticky top-0 bg-white z-10 py-1">Metas por Funcionário (R$)</h3>
                                {stats?.rankingVendedores?.map((v: any) => (
                                    <div key={v.id} className="flex items-center gap-3">
                                        <label className="text-xs font-medium w-28 truncate" title={v.nome}>{v.nome}</label>
                                        <input
                                            name={`metaVendedor_${v.id}`}
                                            type="number"
                                            defaultValue={v.meta}
                                            className="input py-1.5 px-3 text-sm flex-1"
                                            required
                                        />
                                    </div>
                                ))}
                                {(!stats?.rankingVendedores || stats.rankingVendedores.length === 0) && (
                                    <p className="text-[10px] text-gray-400 italic text-center">Nenhum vendedor para atribuir metas individuais.</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
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
