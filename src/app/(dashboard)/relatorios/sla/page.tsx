'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import {
    Clock, Users, AlertTriangle, TrendingDown, CheckCircle,
    ChevronRight, ArrowUp, ArrowDown, Download
} from 'lucide-react';
import { cn, formatarMoeda } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Cell, Legend
} from 'recharts';
import { exportToCSV, exportToExcel } from '@/lib/export-utils';

interface SLAMetric {
    id: string;
    nome: string;
    totalConversas: number;
    mediaTempoRespostaMinutos: number;
    percentualSLA: number;
    violacoesSLA: number;
    totalInteracoes: number;
}

export default function SLAReportPage() {
    const [data, setData] = useState<SLAMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/reports/sla');
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error('Erro ao buscar dados de SLA:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExport = (format: 'csv' | 'xlsx') => {
        const exportData = data.map((d: SLAMetric) => ({
            Atendente: d.nome,
            'Total Conversas': d.totalConversas,
            'Total Interações': d.totalInteracoes,
            'Tempo Médio (min)': d.mediaTempoRespostaMinutos,
            'Violações de SLA': d.violacoesSLA,
            'Aderência SLA (%)': d.percentualSLA
        }));

        const filename = `relatorio_sla_${new Date().toISOString().split('T')[0]}`;
        if (format === 'csv') exportToCSV(exportData, filename);
        else exportToExcel(exportData, filename);
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <Header title="Relatório de SLA" subtitle="Carregando métricas..." />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const totalViolacoes = data.reduce((acc: number, curr: SLAMetric) => acc + curr.violacoesSLA, 0);
    const mediaGeralSLA = data.length > 0 ? Math.round(data.reduce((acc: number, curr: SLAMetric) => acc + curr.percentualSLA, 0) / data.length) : 0;

    return (
        <div className="flex flex-col h-full animate-fade-in pb-20 md:pb-0">
            <Header
                title="Relatório de SLA"
                subtitle="Desempenho de atendimento por atendente"
                actions={
                    <div className="flex gap-2">
                        <button onClick={() => handleExport('csv')} className="btn-ghost py-1.5 px-3 text-xs gap-1">
                            <Download className="w-3.5 h-3.5" />
                            CSV
                        </button>
                        <button onClick={() => handleExport('xlsx')} className="btn-primary py-1.5 px-3 text-xs gap-1">
                            <Download className="w-3.5 h-3.5" />
                            Excel
                        </button>
                    </div>
                }
            />

            <div className="p-4 space-y-5 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
                {/* Resumo cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Aderência Geral SLA</p>
                            <p className="text-2xl font-bold text-text">{mediaGeralSLA}%</p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Total de Violações</p>
                            <p className="text-2xl font-bold text-text">{totalViolacoes}</p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-text-muted font-medium">Conversas Analisadas</p>
                            <p className="text-2xl font-bold text-text">{data.reduce((acc: number, curr: SLAMetric) => acc + curr.totalConversas, 0)}</p>
                        </div>
                    </div>
                </div>

                {/* Gráfico de Aderência */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card">
                        <h3 className="text-sm font-bold text-text mb-4">Aderência ao SLA por Atendente (%)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F0F0F0" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} width={80} />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                    formatter={(v: any) => [`${v}%`, 'Aderência']}
                                />
                                <Bar dataKey="percentualSLA" radius={[0, 4, 4, 0]} barSize={20}>
                                    {data.map((entry: SLAMetric, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.percentualSLA >= 90 ? '#34A853' : entry.percentualSLA >= 70 ? '#FBBC04' : '#EA4335'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <h3 className="text-sm font-bold text-text mb-4">Tempo Médio de Resposta (min)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip
                                    cursor={{ fill: '#F9FAFB' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }}
                                    formatter={(v: any) => [`${v} min`, 'Tempo Médio']}
                                />
                                <Bar dataKey="mediaTempoRespostaMinutos" fill="#1A73E8" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabela detalhada */}
                <div className="card p-0 overflow-hidden">
                    <div className="p-4 border-b border-border bg-gray-50">
                        <h3 className="text-sm font-bold text-text">Detalhamento por Atendente</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-text-muted font-medium border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">Atendente</th>
                                    <th className="px-4 py-3">Conversas</th>
                                    <th className="px-4 py-3">Interações</th>
                                    <th className="px-4 py-3">Tempo Médio</th>
                                    <th className="px-4 py-3">Violações</th>
                                    <th className="px-4 py-3">Aderência</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.map((atendente: SLAMetric) => (
                                    <tr key={atendente.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-text">{atendente.nome}</td>
                                        <td className="px-4 py-3 text-text-muted">{atendente.totalConversas}</td>
                                        <td className="px-4 py-3 text-text-muted">{atendente.totalInteracoes}</td>
                                        <td className="px-4 py-3 text-text-muted">{atendente.mediaTempoRespostaMinutos} min</td>
                                        <td className="px-4 py-3">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                atendente.violacoesSLA > 0 ? "bg-error/10 text-error" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {atendente.violacoesSLA}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className={cn("h-full", atendente.percentualSLA >= 90 ? "bg-success" : atendente.percentualSLA >= 70 ? "bg-warning" : "bg-error")}
                                                        style={{ width: `${atendente.percentualSLA}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold">{atendente.percentualSLA}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted italic">
                                            Nenhum dado de SLA disponível para o período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
