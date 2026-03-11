'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { cn, getAvatarUrl, formatarMoeda, ESPECIALIDADES_MAP, CID_OPTIONS } from '@/lib/utils';
import {
    Search, Filter, Plus, ChevronRight, X, Check, AlertTriangle,
    Phone, Mail, Calendar, Heart, DollarSign, FileText, MessageSquare,
    Download, Upload, ExternalLink
} from 'lucide-react';
import ClienteModal from '@/components/modals/ClienteModal';
import DropdownMenu from '@/components/ui/DropdownMenu';
import { useRouter } from 'next/navigation';
import { exportToCSV, exportToExcel } from '@/lib/export-utils';

type StatusFilter = 'TODOS' | 'ATIVO' | 'INATIVO';

interface Cliente {
    id: string;
    nomePaciente: string;
    nomeResponsavel?: string;
    telefone: string;
    email?: string;
    diagnostico?: string;
    cidCode?: string;
    ativo: boolean;
    terapias: string[];
    tipoPagamento: 'PARTICULAR' | 'CONVENIO' | 'MISTO';
    convenioNome?: string;
    convenioValidade?: string;
    totalGasto: number;
    ultimoContato?: string;
    profissional?: string;
}

const CLIENTES_MOCK: Cliente[] = [
    {
        id: '1', nomePaciente: 'Lucas Henrique Pereira', nomeResponsavel: 'Mariana Pereira',
        telefone: '(48) 99123-4567', email: 'mariana@email.com',
        diagnostico: 'TEA (Autismo)', cidCode: 'F84.0', ativo: true,
        terapias: ['FONOAUDIOLOGIA', 'TERAPIA_OCUPACIONAL'],
        tipoPagamento: 'CONVENIO', convenioNome: 'Unimed', convenioValidade: '2025-12-31',
        totalGasto: 18400, ultimoContato: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        profissional: 'Dra. Ana',
    },
    {
        id: '2', nomePaciente: 'Sofia Almeida Santos', nomeResponsavel: 'Ricardo Santos',
        telefone: '(48) 99234-5678', email: 'ricardo@email.com',
        diagnostico: 'TDAH', cidCode: 'F90.0', ativo: true,
        terapias: ['PSICOLOGIA', 'PSICOPEDAGOGIA'],
        tipoPagamento: 'PARTICULAR',
        totalGasto: 9600, ultimoContato: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
        profissional: 'Dr. Paulo',
    },
    {
        id: '3', nomePaciente: 'Gabriel Oliveira Costa', nomeResponsavel: 'Fernanda Costa',
        telefone: '(48) 99345-6789',
        diagnostico: 'Dislexia', cidCode: 'F81.0', ativo: false,
        terapias: ['PSICOPEDAGOGIA'],
        tipoPagamento: 'PARTICULAR',
        totalGasto: 4800, ultimoContato: new Date(Date.now() - 45 * 24 * 3600000).toISOString(),
    },
    {
        id: '4', nomePaciente: 'Valentina Ramos Lima', nomeResponsavel: 'Juliana Lima',
        telefone: '(48) 99456-7890', email: 'juliana@email.com',
        diagnostico: 'TEA + TDAH', cidCode: 'F84.0', ativo: true,
        terapias: ['FONOAUDIOLOGIA', 'ABA', 'TERAPIA_OCUPACIONAL'],
        tipoPagamento: 'MISTO', convenioNome: 'SulAmérica',
        totalGasto: 27500, ultimoContato: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
        profissional: 'Equipe multidisciplinar',
    },
];

const PAGAMENTO_LABELS: Record<string, { label: string; cor: string }> = {
    PARTICULAR: { label: 'Particular', cor: 'bg-secondary text-primary' },
    CONVENIO: { label: 'Convênio', cor: 'bg-success/10 text-success' },
    MISTO: { label: 'Misto', cor: 'bg-warning/10 text-warning' },
};

function ClienteCard({ cliente, onClick }: { cliente: Cliente; onClick: () => void }) {
    const convenioVencido = cliente.convenioValidade && new Date(cliente.convenioValidade) < new Date();

    return (
        <button
            onClick={onClick}
            className="w-full card hover:shadow-card transition-all group text-left"
        >
            <div className="flex items-start gap-3">
                <img src={getAvatarUrl(cliente.nomePaciente, 44)} className="w-11 h-11 rounded-xl flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                            <p className="text-sm font-bold text-text">{cliente.nomePaciente}</p>
                            {cliente.nomeResponsavel && (
                                <p className="text-xs text-text-muted">Resp.: {cliente.nomeResponsavel}</p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', cliente.ativo ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                                {cliente.ativo ? 'ATIVO' : 'INATIVO'}
                            </span>
                            <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-md', PAGAMENTO_LABELS[cliente.tipoPagamento]?.cor)}>
                                {PAGAMENTO_LABELS[cliente.tipoPagamento]?.label}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                        {cliente.cidCode && (
                            <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-md font-semibold">
                                CID {cliente.cidCode}
                            </span>
                        )}
                        {cliente.terapias.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">
                                {ESPECIALIDADES_MAP[t]}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatarMoeda(cliente.totalGasto)} total
                        </span>
                        {cliente.convenioNome && (
                            <span className={cn('flex items-center gap-1', convenioVencido ? 'text-error' : '')}>
                                {convenioVencido && <AlertTriangle className="w-3 h-3" />}
                                {cliente.convenioNome}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
            </div>
        </button>
    );
}

function ClientePerfil({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
    const [aba, setAba] = useState<'dados' | 'terapias' | 'financeiro' | 'historico'>('dados');
    const convenioVencido = cliente.convenioValidade && new Date(cliente.convenioValidade) < new Date();

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 animate-fade-in">
            <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl border border-border shadow-modal h-[90vh] md:max-h-[85vh] flex flex-col animate-slide-in-up">
                {/* Header */}
                <div className="flex items-center gap-3 p-5 border-b border-border">
                    <img src={getAvatarUrl(cliente.nomePaciente, 48)} className="w-12 h-12 rounded-xl" alt="" />
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-text">{cliente.nomePaciente}</h2>
                        {cliente.nomeResponsavel && <p className="text-xs text-text-muted">Responsável: {cliente.nomeResponsavel}</p>}
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', cliente.ativo ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
                                {cliente.ativo ? 'ATIVO' : 'INATIVO'}
                            </span>
                            {cliente.cidCode && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-semibold">CID {cliente.cidCode}</span>}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/conversas?lead=${cliente.id}`;
                        }}
                        className="btn-secondary py-1.5 px-3 text-xs gap-1"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Conversar
                    </button>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-text-muted">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-4 pt-3 border-b border-border overflow-x-auto">
                    {(['dados', 'terapias', 'financeiro', 'historico'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setAba(t)}
                            className={cn(
                                'px-3 py-2 text-xs font-semibold rounded-t-lg capitalize flex-shrink-0 transition-all border-b-2',
                                aba === t ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text'
                            )}
                        >
                            {t === 'dados' ? 'Dados Pessoais' : t === 'terapias' ? 'Terapias' : t === 'financeiro' ? 'Financeiro' : 'Histórico'}
                        </button>
                    ))}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {aba === 'dados' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide">Contato</h3>
                                <InfoRow icon={<Phone className="w-4 h-4" />} label="Telefone" value={cliente.telefone} />
                                {cliente.email && <InfoRow icon={<Mail className="w-4 h-4" />} label="E-mail" value={cliente.email} />}
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide">Diagnóstico</h3>
                                {cliente.cidCode && <InfoRow icon={<Heart className="w-4 h-4" />} label="CID" value={`${cliente.cidCode} — ${cliente.diagnostico}`} />}
                            </div>
                            {convenioVencido && (
                                <div className="md:col-span-2 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-error/10 border border-error/20">
                                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
                                    <p className="text-sm text-error font-medium">⚠️ Carteirinha do convênio {cliente.convenioNome} está vencida!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {aba === 'terapias' && (
                        <div className="space-y-3">
                            {cliente.terapias.map((t) => (
                                <div key={t} className="card">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-text">{ESPECIALIDADES_MAP[t]}</span>
                                        <span className={cn('text-xs px-2 py-1 rounded-lg', PAGAMENTO_LABELS[cliente.tipoPagamento]?.cor)}>
                                            {PAGAMENTO_LABELS[cliente.tipoPagamento]?.label}
                                        </span>
                                    </div>
                                    {cliente.profissional && (
                                        <p className="text-xs text-text-muted">Profissional: {cliente.profissional}</p>
                                    )}
                                    {cliente.convenioNome && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-text-muted">Convênio: {cliente.convenioNome}</span>
                                            {convenioVencido && <AlertTriangle className="w-3 h-3 text-error" />}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {aba === 'financeiro' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="card text-center">
                                    <p className="text-xs text-text-muted mb-1">Total Gasto</p>
                                    <p className="text-xl font-bold text-primary">{formatarMoeda(cliente.totalGasto)}</p>
                                </div>
                                <div className="card text-center">
                                    <p className="text-xs text-text-muted mb-1">Tipo Pagamento</p>
                                    <p className="text-sm font-bold text-text">{PAGAMENTO_LABELS[cliente.tipoPagamento]?.label}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3">Sessões Recentes</h3>
                                {[
                                    { data: '10/02/2025', terapia: 'Fonoaudiologia', valor: 280, status: 'PAGO' },
                                    { data: '03/02/2025', terapia: 'T. Ocupacional', valor: 280, status: 'PAGO' },
                                    { data: '27/01/2025', terapia: 'Fonoaudiologia', valor: 280, status: 'PENDENTE' },
                                ].map((s, i) => (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-text">{s.terapia}</p>
                                            <p className="text-xs text-text-muted">{s.data}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-text">{formatarMoeda(s.valor)}</span>
                                        <span className={cn(
                                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                            s.status === 'PAGO' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                        )}>
                                            {s.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {aba === 'historico' && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide">Notas internas</h3>
                            <div className="card">
                                <p className="text-xs text-text-muted mb-1">02/02/2025 — Ana Atendente</p>
                                <p className="text-sm text-text">Paciente demonstrou boa evolução na fonoaudiologia. Responsável relatou melhora na comunicação em casa.</p>
                            </div>
                            <div className="card">
                                <p className="text-xs text-text-muted mb-1">15/01/2025 — Carlos Vendedor</p>
                                <p className="text-sm text-text">Primeiro contato. Família veio por indicação. Diagnóstico de TEA confirmado com laudo do neurologista.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 text-primary">
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-sm text-text font-medium">{value}</p>
            </div>
        </div>
    );
}

export default function ClientesPage({ params }: { params: { status: string } }) {
    const isAtivo = params.status !== 'inativos';
    const [busca, setBusca] = useState('');
    const [filtroTerapia, setFiltroTerapia] = useState('');
    const [filtroPagamento, setFiltroPagamento] = useState('');
    const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
    const [showNovoModal, setShowNovoModal] = useState(false);

    // Estado persistente simulado
    const [clientesList, setClientesList] = useState<Cliente[]>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('crm_clientes') : null;
        return saved ? JSON.parse(saved) : CLIENTES_MOCK;
    });

    const saveClientes = (newList: Cliente[]) => {
        setClientesList(newList);
        localStorage.setItem('crm_clientes', JSON.stringify(newList));
    };

    const handleExport = (format: 'csv' | 'xlsx') => {
        const dataToExport = clientesList.map(c => ({
            ID: c.id,
            'Nome Paciente': c.nomePaciente,
            Responsavel: c.nomeResponsavel || '',
            Telefone: c.telefone,
            Email: c.email || '',
            Diagnostico: c.diagnostico || '',
            CID: c.cidCode || '',
            Status: c.ativo ? 'Ativo' : 'Inativo',
            'Total Gasto': c.totalGasto,
            'Ultimo Contato': c.ultimoContato ? new Date(c.ultimoContato).toLocaleDateString('pt-BR') : ''
        }));

        const filename = `clientes_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            exportToCSV(dataToExport, filename);
        } else {
            exportToExcel(dataToExport, filename);
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re: any) => {
                alert('Importação simulada com sucesso! (Leitura de 5 novos registros)');
                // No mundo real, aqui faria o processamento do CSV
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleAddCliente = (data: any) => {
        saveClientes([{ ...data, id: Date.now().toString() }, ...clientesList]);
        setShowNovoModal(false);
        alert('Novo cliente cadastrado com sucesso!');
    };

    const clientes = clientesList.filter((c) => {
        if (isAtivo && !c.ativo) return false;
        if (!isAtivo && c.ativo) return false;
        if (busca && !c.nomePaciente.toLowerCase().includes(busca.toLowerCase()) &&
            !c.nomeResponsavel?.toLowerCase().includes(busca.toLowerCase()) &&
            !c.telefone.includes(busca)) return false;
        if (filtroTerapia && !c.terapias.includes(filtroTerapia)) return false;
        if (filtroPagamento && c.tipoPagamento !== filtroPagamento) return false;
        return true;
    });

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <Header
                title={isAtivo ? 'Clientes Ativos' : 'Clientes Inativos'}
                subtitle={`${clientes.length} pacientes`}
                actions={
                    <div className="flex gap-2">
                        <DropdownMenu
                            trigger={
                                <div className="btn-ghost py-1.5 px-3 text-xs gap-1 flex items-center">
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Exportar</span>
                                </div>
                            }
                            items={[
                                { label: 'Exportar CSV', icon: FileText, onClick: () => handleExport('csv') },
                                { label: 'Exportar Excel', icon: FileText, onClick: () => handleExport('xlsx') },
                            ]}
                        />
                        <button onClick={handleImport} className="btn-secondary py-1.5 px-3 text-xs gap-1">
                            <Upload className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Importar</span>
                        </button>
                        <button onClick={() => setShowNovoModal(true)} className="btn-primary py-1.5 px-3 text-xs gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Novo</span>
                        </button>
                    </div>
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 px-4 py-2 bg-white border-b border-border">
                <a href="/clientes/ativos" className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold', isAtivo ? 'bg-secondary text-primary' : 'text-text-muted hover:bg-gray-50')}>Ativos</a>
                <a href="/clientes/inativos" className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold', !isAtivo ? 'bg-secondary text-primary' : 'text-text-muted hover:bg-gray-50')}>Inativos</a>
            </div>

            {/* Filtros */}
            <div className="p-4 bg-white border-b border-border space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome, responsável ou telefone..."
                        className="input pl-9"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <select
                        value={filtroTerapia}
                        onChange={(e) => setFiltroTerapia(e.target.value)}
                        className="input text-xs py-1.5 flex-shrink-0"
                        style={{ width: 'auto', minWidth: '160px' }}
                    >
                        <option value="">Todas as terapias</option>
                        {Object.entries(ESPECIALIDADES_MAP).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                    <select
                        value={filtroPagamento}
                        onChange={(e) => setFiltroPagamento(e.target.value)}
                        className="input text-xs py-1.5 flex-shrink-0"
                        style={{ width: 'auto', minWidth: '140px' }}
                    >
                        <option value="">Todos os pagamentos</option>
                        <option value="PARTICULAR">Particular</option>
                        <option value="CONVENIO">Convênio</option>
                        <option value="MISTO">Misto</option>
                    </select>
                    {(filtroTerapia || filtroPagamento || busca) && (
                        <button
                            onClick={() => { setFiltroTerapia(''); setFiltroPagamento(''); setBusca(''); }}
                            className="btn-ghost text-xs py-1.5 px-3 gap-1 flex-shrink-0"
                        >
                            <X className="w-3.5 h-3.5" /> Limpar
                        </button>
                    )}
                </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {clientes.map((c) => (
                    <ClienteCard key={c.id} cliente={c} onClick={() => setClienteSelecionado(c)} />
                ))}
                {clientes.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-base font-semibold text-text mb-1">Nenhum cliente encontrado</p>
                        <p className="text-sm text-text-muted">Tente ajustar os filtros de busca</p>
                    </div>
                )}
            </div>

            {/* Painel do cliente */}
            {clienteSelecionado && (
                <ClientePerfil cliente={clienteSelecionado} onClose={() => setClienteSelecionado(null)} />
            )}

            {showNovoModal && (
                <ClienteModal
                    onClose={() => setShowNovoModal(false)}
                    onSave={handleAddCliente}
                />
            )}
        </div>
    );
}
