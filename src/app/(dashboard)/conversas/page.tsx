'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatTempo, formatDuracao, getAvatarUrl } from '@/lib/utils';
import {
    Search, Send, Paperclip, Smile, MoreVertical, ArrowLeftRight,
    Clock, Check, CheckCheck, Circle, X, User, Tag,
    Image as ImageIcon, File as FileIcon, Mic, CalendarPlus, Play, Pause, Download as DownloadIcon
} from 'lucide-react';
import TransferenciaModal from '@/components/chat/TransferenciaModal';
import LeadDetailsModal from '@/components/modals/LeadDetailsModal';
import DropdownMenu from '@/components/ui/DropdownMenu';
import GanhoVendaModal from '@/components/modals/GanhoVendaModal';
import { uploadFileToStorage } from '@/lib/storage';

interface Lead {
    id: string;
    nome: string;
    telefone: string;
    ultimaMensagem: string;
    ultimaMensagemAt: string;
    naoLidas: number;
    kanbanAtenStat: string;
    minutosSemResposta: number;
    atribuidoA?: string;
    tags: string[];
    valor?: number;
    busca?: string;
    pagamento?: string;
}

interface Mensagem {
    id: string;
    conteudo: string;
    de: string;
    timestamp: string;
    lida: boolean;
    tipo?: 'mensagem' | 'nota' | 'imagem' | 'audio' | 'arquivo';
    url?: string;
    nomeArquivo?: string;
    duracao?: string;
}

// Tipos já definidos na interface

const STATUS_LABELS: Record<string, { label: string; cor: string }> = {
    fila_espera: { label: 'Fila de Espera', cor: 'bg-gray-100 text-gray-600' },
    em_atendimento: { label: 'Em Atendimento', cor: 'bg-secondary text-primary' },
    qualificado: { label: 'Qualificado', cor: 'bg-warning/10 text-warning' },
    encerrado: { label: 'Encerrado', cor: 'bg-success/10 text-success' },
    novo_lead: { label: 'Novo Lead', cor: 'bg-gray-100 text-gray-600' },
    proposta_enviada: { label: 'Proposta Enviada', cor: 'bg-secondary text-primary' },
    negociacao: { label: 'Negociação', cor: 'bg-warning/10 text-warning' },
    ganho: { label: 'Ganho ✓', cor: 'bg-success/10 text-success' },
    perdido: { label: 'Perdido', cor: 'bg-error/10 text-error' },
    desqualificado: { label: 'Desqualificado', cor: 'bg-gray-200 text-gray-500' },
};

const TAG_COLORS: Record<string, string> = {
    'Google ADS': 'bg-blue-100 text-blue-700 border-blue-200',
    'Facebook ADS': 'bg-pink-100 text-pink-700 border-pink-200',
    'Facebook/Instagram ADS': 'bg-pink-100 text-pink-700 border-pink-200',
    'Instagram ads': 'bg-purple-100 text-purple-700 border-purple-200',
    'Indicação': 'bg-green-100 text-green-700 border-green-200',
    'Ganho': 'bg-success/10 text-success border-success/20',
    'Perdido': 'bg-error/10 text-error border-error/20',
    'Desqualificado': 'bg-gray-100 text-gray-600 border-gray-200',
};

function getSlaClass(minutos: number) {
    if (minutos >= 60) return 'sla-danger';
    if (minutos >= 30) return 'sla-warning';
    return 'sla-normal';
}

export default function ConversasPage() {
    const { usuario, isAdmin, isVendedor, isAtendente } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [leadAtivo, setLeadAtivo] = useState<Lead | null>(null);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [showLeadDetailsModal, setShowLeadDetailsModal] = useState(false);
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [mensagemAgendamento, setMensagemAgendamento] = useState('');
    const [busca, setBusca] = useState('');
    const [showTransferencia, setShowTransferencia] = useState(false);
    const [showGanhoModal, setShowGanhoModal] = useState(false);
    const [showNotas, setShowNotas] = useState(false);
    const [isNoteMode, setIsNoteMode] = useState(false);
    const [showScheduling, setShowScheduling] = useState(false);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'imagem' | 'audio' | 'arquivo' | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingPreview, setPlayingPreview] = useState(false);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleDesqualificar = async (leadId: string) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kanbanAtenStat: 'desqualificado',
                    tags: Array.from(new Set([...(leads.find(l => l.id === leadId)?.tags || []), 'Desqualificado']))
                })
            });
            if (res.ok) fetchLeads();
        } catch (err) {
            console.error('Erro ao desqualificar:', err);
        }
    };

    const handleAddTag = async (leadId: string, tag: string) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tags: Array.from(new Set([...(leads.find(l => l.id === leadId)?.tags || []), tag]))
                })
            });
            if (res.ok) fetchLeads();
        } catch (err) {
            console.error('Erro ao adicionar tag:', err);
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fetchLeads = async (q = '') => {
        try {
            setLoadingLeads(true);
            const res = await fetch(`/api/leads?q=${q}`);
            const json = await res.json();
            if (json.success) setLeads(json.data);
        } finally {
            setLoadingLeads(false);
        }
    };

    const fetchMensagens = async (leadId: string) => {
        try {
            setLoadingMsgs(true);
            const res = await fetch(`/api/leads/${leadId}/mensagens`);
            const json = await res.json();
            if (json.success) setMensagens(json.data);
        } finally {
            setLoadingMsgs(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    // Carrega o lead partindo do Kanban ou ao selecionar na lista
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const leadId = urlParams.get('lead');
        if (leadId) {
            // Se vier via URL, precisamos do lead completo. 
            // Para simplificar agora, clicamos na lista ou buscamos.
            window.history.replaceState({}, '', '/conversas');
        }
    }, []);

    useEffect(() => {
        if (leadAtivo) {
            fetchMensagens(leadAtivo.id);
        } else {
            setMensagens([]);
        }
    }, [leadAtivo]);

    const handleStatusChange = (leadId: string, novoStatus: string) => {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, kanbanAtenStat: novoStatus } : l));
        if (leadAtivo?.id === leadId) {
            setLeadAtivo((prev) => prev ? { ...prev, kanbanAtenStat: novoStatus } : prev);
        }
    };

    const handleGanho = (valor: number, vendedorId: string, servico: string, origem: string, pagamento: string) => {
        if (!leadAtivo) return;

        // Atualiza status do lead e campos de fechamento
        setLeads((prev) => prev.map((l) =>
            l.id === leadAtivo.id
                ? { ...l, kanbanAtenStat: 'ganho', valor, servico, pagamento } as any
                : l
        ));

        if (leadAtivo.id === leadAtivo.id) {
            setLeadAtivo(null); // Remove lead ativo pois ele sai da lista de conversas
        }

        // Atualiza dashboard (simulado via localStorage)
        const localVendedores = localStorage.getItem('crm_vendedores');
        const vendedores = localVendedores ? JSON.parse(localVendedores) : [
            { nome: 'Carlos Vendedor', vendas: 32500, meta: 40000, conversoes: 12 },
            { nome: 'Admin Sistema', vendas: 18725, meta: 28000, conversoes: 9 },
        ];

        const vIdx = parseInt(vendedorId);
        if (vendedores[vIdx]) {
            vendedores[vIdx].vendas += valor;
            vendedores[vIdx].conversoes += 1;
            localStorage.setItem('crm_vendedores', JSON.stringify(vendedores));
        }

        // Salvar log de venda (simulado)
        const vendasLog = JSON.parse(localStorage.getItem('crm_vendas_log') || '[]');
        vendasLog.push({
            data: new Date().toISOString(),
            lead: leadAtivo.nome,
            valor,
            vendedor: vendedores[vIdx]?.nome || 'Desconhecido',
            servico,
            origem,
            pagamento
        });
        localStorage.setItem('crm_vendas_log', JSON.stringify(vendasLog));

        // AUTOMATIZAÇÃO: Adicionar como Cliente Ativo
        const localClientes = localStorage.getItem('crm_clientes');
        const currentClientes = localClientes ? JSON.parse(localClientes) : [];
        const novoCliente = {
            id: leadAtivo.id,
            nomePaciente: leadAtivo.nome,
            telefone: leadAtivo.telefone,
            ativo: true,
            terapias: [servico],
            tipoPagamento: pagamento === 'Convênio' ? 'CONVENIO' : 'PARTICULAR',
            totalGasto: valor,
            diagnostico: leadAtivo.busca || servico,
            ultimoContato: new Date().toISOString()
        };
        localStorage.setItem('crm_clientes', JSON.stringify([novoCliente, ...currentClientes]));

        setShowGanhoModal(false);
        alert(`Venda registrada com sucesso!\nValor: R$ ${valor.toFixed(2)}\nPagamento: ${pagamento}`);
    };

    const handleSaveLeadDetails = (data: any) => {
        if (!leadAtivo) return;
        setLeads(prev => prev.map(l =>
            l.id === leadAtivo.id ? { ...l, ...data } : l
        ));
        setLeadAtivo(prev => prev ? { ...prev, ...data } : null);
        setShowLeadDetailsModal(false);
    };

    const handleConfirmTransferencia = async (destinoId: string, resumo: string, orientacoes: string) => {
        if (!leadAtivo) return;

        try {
            const res = await fetch(`/api/leads/${leadAtivo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ atribuidoA: destinoId })
            });

            if (res.ok) {
                // Registrar nota da transferência
                await fetch(`/api/leads/${leadAtivo.id}/mensagens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        conteudo: `TRANSFERÊNCIA: ${resumo}${orientacoes ? `\n\nOrientações: ${orientacoes}` : ''}`,
                        tipo: 'NOTA',
                        de: 'sistema'
                    })
                });
                fetchLeads();
                fetchMensagens(leadAtivo.id);
                setShowTransferencia(false);
            }
        } catch (err) {
            console.error('Erro ao transferir:', err);
        }
    };

    const leadsVisiveis = leads.filter((l) => {
        // Se estamos conversando com ele agora, deve ser visível (ex: vindo do Perfil do Cliente)
        if (leadAtivo?.id === l.id) return true;

        // Leads fechados (Perdidos/Desqualificados) saem da lista de conversas ativas
        // Leads Ganhos também saem (vão para LTV) conforme solicitado, EXCETO se o usuário for atendente (que cuida de clientes)
        const isFechado = ['perdido', 'desqualificado'].includes(l.kanbanAtenStat);
        if (isFechado) return false;

        if (isAdmin) return true;

        if (isVendedor) {
            // Vendedor só vê seus leads e não vê quem já virou cliente (sai da lista dele)
            if (l.kanbanAtenStat === 'ganho') return false;
            return l.atribuidoA === usuario?.id;
        }

        if (isAtendente) {
            // Atendente vê quem já é cliente (Ganho) ou quem lhe foi atribuído
            return l.kanbanAtenStat === 'ganho' || l.atribuidoA === usuario?.id;
        }

        return false;
    });

    const leadsFiltrados = leadsVisiveis.filter((l) =>
        l.nome.toLowerCase().includes(busca.toLowerCase()) ||
        l.telefone.includes(busca)
    );

    // Remover listener de localStorage e persistência mockada
    useEffect(() => {
        if (!leadAtivo) return;
        // O sincronismo agora é via API
    }, [leadAtivo]);

    // Efeito para verificar agendamentos e persistir envios
    useEffect(() => {
        const checkScheduled = () => {
            const key = `crm_mensagens_agendadas_${usuario?.clinica?.id || 'anon'}`;
            const agendadas = JSON.parse(localStorage.getItem(key) || '[]');
            const agora = new Date();
            const hoje = agora.toISOString().split('T')[0];
            const horaAtual = agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');

            const paraEnviar = agendadas.filter((msg: any) =>
                msg.data < hoje || (msg.data === hoje && msg.hora <= horaAtual)
            );

            if (paraEnviar.length > 0) {
                const restantes = agendadas.filter((msg: any) =>
                    !(msg.data < hoje || (msg.data === hoje && msg.hora <= horaAtual))
                );

                paraEnviar.forEach((msg: any) => {
                    // Sincronizar via API se for o lead ativo
                    if (leadAtivo?.id === msg.leadId) {
                        fetchMensagens(msg.leadId);
                    }
                });

                localStorage.setItem(`crm_mensagens_agendadas_${usuario?.clinica?.id || 'anon'}`, JSON.stringify(restantes));
            }
        };

        const interval = setInterval(checkScheduled, 20000);
        return () => clearInterval(interval);
    }, [leadAtivo, usuario]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mensagens]);

    const enviarMensagem = async () => {
        if ((!novaMensagem.trim() && !selectedFile && !audioBlob) || !leadAtivo) return;

        let urlUpload = '';

        try {
            // Se houver arquivo ou áudio, faz o upload primeiro para o Supabase
            if (audioBlob || selectedFile) {

                if (audioBlob) {
                    const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                    urlUpload = await uploadFileToStorage(file, `conversas/${leadAtivo.id}/audio_${Date.now()}.webm`);
                } else if (selectedFile) {
                    urlUpload = await uploadFileToStorage(selectedFile, `conversas/${leadAtivo.id}/${Date.now()}_${selectedFile.name}`);
                }
            }

            const payload = {
                conteudo: isNoteMode ? novaMensagem : (novaMensagem || (selectedFile?.name || 'Áudio')),
                tipo: isNoteMode ? 'NOTA' : (fileType?.toUpperCase() || 'TEXTO'),
                de: 'sistema',
                url: urlUpload || undefined, // a URL da imagem ou do áudio que vai pro banco
                nomeArquivo: selectedFile?.name || (audioBlob ? 'audio.webm' : undefined)
            };

            const res = await fetch(`/api/leads/${leadAtivo.id}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                fetchMensagens(leadAtivo.id);
                fetchLeads(); // Atualizar última mensagem na lista
                setNovaMensagem('');
                if (isNoteMode) setIsNoteMode(false);
                setFilePreview(null);
                setSelectedFile(null);
                setFileType(null);
                setAudioBlob(null);
                setRecordingTime(0);
            }
        } catch (error: any) {
            console.error('Erro ao enviar mensagem:', error);
            alert(`Erro ao enviar: ${error.message || 'Erro desconhecido'}. Por favor, verifique o console do navegador e do servidor.`);
        }
    };
    const handleScheduleMessage = () => {
        if (!scheduledDate || !scheduledTime || (!mensagemAgendamento.trim() && !selectedFile && !audioBlob)) {
            alert('Preencha a data, hora e a mensagem/arquivo.');
            return;
        }

        const scheduledMsg = {
            id: `sch-${Date.now()}`,
            conteudo: mensagemAgendamento,
            data: scheduledDate,
            hora: scheduledTime,
            tipo: fileType || 'mensagem',
            arquivo: selectedFile?.name || (audioBlob ? 'audio_gravado.webm' : undefined)
        };

        const key = `crm_mensagens_agendadas_${usuario?.clinica?.id || 'anon'}`;
        const agendadas = JSON.parse(localStorage.getItem(key) || '[]');
        agendadas.push({ ...scheduledMsg, leadId: leadAtivo?.id, leadNome: leadAtivo?.nome });
        localStorage.setItem(key, JSON.stringify(agendadas));

        alert(`Mensagem agendada para ${scheduledDate} às ${scheduledTime}`);
        setShowScheduling(false);
        setMensagemAgendamento('');
        setFilePreview(null);
        setSelectedFile(null);
        setFileType(null);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setFileType('audio');
                setFilePreview(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            alert("Não foi possível acessar o microfone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setAudioBlob(null);
            setFilePreview(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'imagem' | 'audio' | 'arquivo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setFileType(type);

        if (type === 'imagem' || type === 'audio') {
            const reader = new FileReader();
            reader.onload = (ev) => setFilePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(file.name);
        }
    };

    return (
        <div className="h-[calc(100vh-0px)] flex flex-col md:flex-row animate-fade-in overflow-hidden">

            {/* Lista de conversas */}
            <div className={cn(
                'w-full md:w-80 flex-shrink-0 bg-white border-r border-border flex flex-col',
                leadAtivo ? 'hidden md:flex' : 'flex'
            )}>
                <Header title="Conversas" subtitle="WhatsApp" notifCount={5} />

                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar conversa..."
                            className="input pl-9 text-sm py-2"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {leadsFiltrados.map((lead) => (
                        <button
                            key={lead.id}
                            onClick={() => setLeadAtivo(lead)}
                            className={cn(
                                'w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-l-2',
                                leadAtivo?.id === lead.id ? 'bg-secondary border-primary' : 'border-transparent',
                                getSlaClass(lead.minutosSemResposta)
                            )}
                        >
                            <div className="relative flex-shrink-0">
                                <img
                                    src={getAvatarUrl(lead.nome, 40)}
                                    alt={lead.nome}
                                    className="w-10 h-10 rounded-full"
                                />
                                {lead.minutosSemResposta >= 60 && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-error border-2 border-white flex items-center justify-center">
                                        <Clock className="w-2 h-2 text-white" />
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-sm font-semibold text-text truncate">{lead.nome}</span>
                                    <span className="text-[10px] text-text-muted flex-shrink-0 ml-2">{formatTempo(lead.ultimaMensagemAt)}</span>
                                </div>
                                <p className="text-xs text-text-muted truncate mb-1">{lead.ultimaMensagem}</p>
                                <div className="flex items-center gap-2">
                                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md', STATUS_LABELS[lead.kanbanAtenStat]?.cor)}>
                                        {STATUS_LABELS[lead.kanbanAtenStat]?.label}
                                    </span>
                                    <div className="flex gap-1 overflow-hidden">
                                        {lead.tags.map(tag => (
                                            <span key={tag} className={cn('text-[9px] px-1 rounded border whitespace-nowrap', TAG_COLORS[tag] || 'bg-gray-100')}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {lead.minutosSemResposta > 0 && (
                                        <span className={cn('text-[10px] flex items-center gap-0.5', lead.minutosSemResposta >= 60 ? 'text-error' : lead.minutosSemResposta >= 30 ? 'text-warning' : 'text-text-muted')}>
                                            <Clock className="w-2.5 h-2.5" /> {lead.minutosSemResposta}min
                                        </span>
                                    )}
                                    {lead.naoLidas > 0 && (
                                        <span className="ml-auto badge">{lead.naoLidas}</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            {leadAtivo ? (
                <div className="flex-1 flex flex-row overflow-hidden bg-gray-50">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Chat header */}
                        <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
                            <button
                                className="md:hidden text-text-muted mr-1"
                                onClick={() => setLeadAtivo(null)}
                            >
                                ←
                            </button>
                            <img src={getAvatarUrl(leadAtivo.nome, 36)} className="w-9 h-9 rounded-full" alt="" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-text truncate">{leadAtivo.nome}</p>
                                    <div className="flex gap-1">
                                        {leadAtivo.tags.map(tag => (
                                            <span key={tag} className={cn('text-[9px] px-1.5 py-0.5 rounded-md border', TAG_COLORS[tag] || 'bg-gray-100')}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {leadAtivo.valor && !['fila_espera', 'em_atendimento', 'qualificado'].includes(leadAtivo.kanbanAtenStat) && (
                                        <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md ml-auto">
                                            R$ {leadAtivo.valor.toLocaleString('pt-BR')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-text-muted">{leadAtivo.telefone}</p>
                                    {leadAtivo.busca && (
                                        <>
                                            <span className="text-text-muted">•</span>
                                            <p className="text-[10px] text-primary font-medium bg-secondary px-1.5 py-0.5 rounded-md truncate max-w-[150px]">
                                                {leadAtivo.busca}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <select
                                value={leadAtivo.kanbanAtenStat}
                                onChange={(e) => handleStatusChange(leadAtivo.id, e.target.value)}
                                className={cn(
                                    'text-[11px] sm:text-xs px-2 py-1.5 rounded-lg font-medium border-none outline-none cursor-pointer appearance-none text-center',
                                    STATUS_LABELS[leadAtivo.kanbanAtenStat]?.cor || 'bg-gray-100 text-black'
                                )}
                            >
                                <optgroup label="Atendimento">
                                    <option value="fila_espera">Fila de Espera</option>
                                    <option value="em_atendimento">Em Atendimento</option>
                                    <option value="qualificado">Qualificado</option>
                                    <option value="encerrado">Encerrado</option>
                                </optgroup>
                                <optgroup label="Vendas">
                                    <option value="novo_lead">Novo Lead</option>
                                    <option value="proposta_enviada">Proposta Enviada</option>
                                    <option value="negociacao">Negociação</option>
                                    <option value="ganho">Ganho ✓</option>
                                    <option value="perdido">Perdido</option>
                                    <option value="desqualificado">Desqualificado</option>
                                </optgroup>
                            </select>
                            <button
                                onClick={() => setShowTransferencia(true)}
                                className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
                            >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                Transferir
                            </button>
                            <DropdownMenu
                                trigger={
                                    <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-text-muted">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                }
                                items={[
                                    { label: 'Editar Lead', icon: User, onClick: () => setShowLeadDetailsModal(true) },
                                    { label: 'Transferir', icon: ArrowLeftRight, onClick: () => setShowTransferencia(true) },
                                    { label: 'Dar Ganho', icon: Check, onClick: () => setShowGanhoModal(true) },
                                    { label: 'Desqualificar Lead', icon: X, onClick: () => handleDesqualificar(leadAtivo.id) },
                                    { label: 'Origem: Google', icon: Circle, onClick: () => handleAddTag(leadAtivo.id, 'Google ADS') },
                                    { label: 'Origem: Meta', icon: Circle, onClick: () => handleAddTag(leadAtivo.id, 'Facebook/Instagram ADS') },
                                    { label: 'Origem: Indicação', icon: Circle, onClick: () => handleAddTag(leadAtivo.id, 'Indicação') },
                                    { label: 'Anotação Interna', icon: Smile, onClick: () => setIsNoteMode(true) },
                                    { label: 'Encerrar Conversa', icon: Circle, onClick: () => handleStatusChange(leadAtivo.id, 'encerrado'), variant: 'danger' },
                                ]}
                            />
                            <button
                                onClick={() => setIsNoteMode(!isNoteMode)}
                                className={cn(
                                    "p-2 rounded-xl transition-all",
                                    isNoteMode ? "bg-warning/20 text-warning ring-2 ring-warning/30" : "text-text-muted hover:bg-gray-100"
                                )}
                                title="Modo Anotação (Lembrete Interno)"
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Alerta SLA */}
                        {leadAtivo.minutosSemResposta >= 60 && (
                            <div className="bg-error/10 border-b border-error/20 px-4 py-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-error flex-shrink-0" />
                                <p className="text-xs text-error font-medium">
                                    ⚠️ Sem resposta há {leadAtivo.minutosSemResposta} minutos — SLA excedido!
                                </p>
                            </div>
                        )}

                        {/* Mensagens */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-outfit">
                            {mensagens.map((msg) => {
                                const isMe = msg.de === 'sistema';
                                const isNote = msg.tipo === 'nota';

                                if (isNote) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                                            <div className="bg-yellow-50 border border-yellow-200/50 rounded-2xl px-6 py-3 max-w-[85%] shadow-sm relative group overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Smile className="w-3.5 h-3.5 text-warning" />
                                                    <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Anotação Interna</span>
                                                </div>
                                                <p className="text-sm text-text-muted leading-relaxed italic">{msg.conteudo}</p>
                                                <div className="flex justify-end mt-1">
                                                    <span className="text-[9px] text-text-light">
                                                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (msg.tipo === 'imagem') {
                                    return (
                                        <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                            <div className={cn('max-w-[70%] rounded-2xl overflow-hidden shadow-soft border border-border', isMe ? 'bg-primary' : 'bg-white')}>
                                                <img src={msg.url || '/placeholder.png'} alt="Imagem" className="w-full h-auto max-h-60 object-cover" />
                                                <div className="p-2 flex items-center justify-between gap-4">
                                                    {msg.conteudo && <p className={cn('text-sm', isMe ? 'text-white' : 'text-text')}>{msg.conteudo}</p>}
                                                    <span className={cn('text-[10px] whitespace-nowrap', isMe ? 'text-white/70' : 'text-text-muted')}>
                                                        {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (msg.tipo === 'audio') {
                                    return (
                                        <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                            <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl shadow-soft flex items-center gap-3', isMe ? 'bg-primary text-white' : 'bg-white text-text border border-border')}>
                                                <button
                                                    onClick={() => {
                                                        const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
                                                        if (playingId === msg.id) {
                                                            audio.pause();
                                                            setPlayingId(null);
                                                        } else {
                                                            if (playingId) {
                                                                const other = document.getElementById(`audio-${playingId}`) as HTMLAudioElement;
                                                                if (other) other.pause();
                                                            }
                                                            audio.play();
                                                            setPlayingId(msg.id);
                                                        }
                                                    }}
                                                    className={cn('w-8 h-8 rounded-full flex items-center justify-center', isMe ? 'bg-white/20' : 'bg-secondary text-primary')}
                                                >
                                                    {playingId === msg.id ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                </button>
                                                <audio
                                                    id={`audio-${msg.id}`}
                                                    src={msg.url}
                                                    onEnded={() => setPlayingId(null)}
                                                    onPause={() => playingId === msg.id && setPlayingId(null)}
                                                    className="hidden"
                                                />
                                                <div className="flex-1 min-w-[120px]">
                                                    <div className="h-1 bg-current opacity-20 rounded-full w-full mb-1" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-medium">{msg.duracao || '0:12'}</span>
                                                        <span className="text-[10px] opacity-70">
                                                            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Mic className="w-4 h-4 opacity-50" />
                                            </div>
                                        </div>
                                    );
                                }

                                if (msg.tipo === 'arquivo') {
                                    return (
                                        <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                            <div className={cn('max-w-[75%] px-3 py-2 rounded-2xl shadow-soft flex items-center gap-3 border', isMe ? 'bg-primary text-white border-white/10' : 'bg-white text-text border-border')}>
                                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isMe ? 'bg-white/20' : 'bg-secondary text-primary')}>
                                                    <FileIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{msg.nomeArquivo || 'documento.pdf'}</p>
                                                    <p className="text-[10px] opacity-70">2.4 MB • {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <button className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                                                    <DownloadIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                        <div className={cn(
                                            'max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-soft',
                                            isMe
                                                ? 'bg-primary text-white rounded-br-sm'
                                                : 'bg-white text-text border border-border rounded-bl-sm'
                                        )}>
                                            <p className="leading-relaxed">{msg.conteudo}</p>
                                            <div className={cn('flex items-center gap-1 mt-1 justify-end', isMe ? 'text-white/70' : 'text-text-muted')}>
                                                <span className="text-[10px]">
                                                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    msg.lida ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className={cn(
                            "transition-all border-t border-border p-3 flex flex-col gap-2",
                            isNoteMode ? "bg-yellow-50/50" : "bg-white"
                        )}>
                            {isNoteMode && (
                                <div className="flex items-center justify-between px-2 py-1 bg-warning/10 rounded-lg border border-warning/20">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                                        <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Modo Anotação Interna Ativo</span>
                                    </div>
                                    <button
                                        onClick={() => setIsNoteMode(false)}
                                        className="p-1 hover:bg-warning/20 rounded-md transition-colors"
                                        title="Cancelar anotação"
                                    >
                                        <X className="w-3.5 h-3.5 text-warning" />
                                    </button>
                                </div>
                            )}
                            {/* Preview de Arquivo */}
                            {filePreview && (
                                <div className="mx-2 mb-2 p-2 bg-secondary/30 rounded-xl border border-secondary flex items-center gap-3 animate-in slide-in-from-bottom-2">
                                    {fileType === 'imagem' ? (
                                        <img src={filePreview} className="w-12 h-12 rounded-lg object-cover border border-border" alt="" />
                                    ) : fileType === 'audio' ? (
                                        <button
                                            onClick={() => {
                                                if (previewAudioRef.current) {
                                                    if (playingPreview) {
                                                        previewAudioRef.current.pause();
                                                    } else {
                                                        previewAudioRef.current.play();
                                                    }
                                                    setPlayingPreview(!playingPreview);
                                                }
                                            }}
                                            className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                                        >
                                            {playingPreview ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                            <audio
                                                ref={previewAudioRef}
                                                src={filePreview || ''}
                                                onEnded={() => setPlayingPreview(false)}
                                                className="hidden"
                                            />
                                        </button>
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                            <FileIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-primary truncate">{selectedFile?.name || (audioBlob ? 'Áudio Gravado' : 'Arquivo')}</p>
                                        <p className="text-[10px] text-text-muted">
                                            {selectedFile ? (selectedFile.size / 1024).toFixed(1) : audioBlob ? (audioBlob.size / 1024).toFixed(1) : '0'} KB
                                        </p>
                                    </div>
                                    <button onClick={() => { setFilePreview(null); setSelectedFile(null); setFileType(null); setAudioBlob(null); }} className="p-1.5 hover:bg-secondary/50 rounded-lg text-primary">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Agendamento Modal Inline */}
                            {showScheduling && (
                                <div className="mx-2 mb-2 p-3 bg-white rounded-xl border-2 border-primary shadow-lg animate-in zoom-in-95">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2 text-primary">
                                            <CalendarPlus className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Agendar Mensagem</span>
                                        </div>
                                        <button onClick={() => setShowScheduling(false)} className="text-text-muted hover:text-text">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Data</label>
                                            <input
                                                type="date"
                                                value={scheduledDate}
                                                onChange={(e) => setScheduledDate(e.target.value)}
                                                className="input py-1.5 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Hora</label>
                                            <input
                                                type="time"
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className="input py-1.5 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Mensagem do Agendamento</label>
                                        <textarea
                                            value={mensagemAgendamento}
                                            onChange={(e) => setMensagemAgendamento(e.target.value)}
                                            placeholder="Digite o texto que será enviado..."
                                            className="input py-1.5 text-xs resize-none h-20"
                                        />
                                    </div>
                                    <button
                                        onClick={handleScheduleMessage}
                                        disabled={!scheduledDate || !scheduledTime || !mensagemAgendamento.trim()}
                                        className="w-full btn-primary py-2 text-xs gap-2 mb-4"
                                    >
                                        <Check className="w-4 h-4" />Confirmar Agendamento
                                    </button>

                                    {/* Lista de Agendados neste Lead */}
                                    {(() => {
                                        const agendadas = JSON.parse(localStorage.getItem('crm_mensagens_agendadas') || '[]');
                                        const doLead = agendadas.filter((a: any) => a.leadId === leadAtivo.id);
                                        if (doLead.length === 0) return null;

                                        return (
                                            <div className="border-t border-border pt-3 mt-1">
                                                <p className="text-[10px] font-bold text-primary uppercase mb-2 tracking-widest flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" /> Agendamentos Pendentes
                                                </p>
                                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                                    {doLead.map((ag: any) => (
                                                        <div key={ag.id} className="bg-gray-50 border border-border rounded-lg p-2 flex items-center justify-between group">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] text-text font-medium truncate">{ag.conteudo}</p>
                                                                <p className="text-[9px] text-text-muted flex items-center gap-1">
                                                                    <CalendarPlus className="w-2 h-2" />
                                                                    {new Date(ag.data + 'T' + ag.hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const rest = agendadas.filter((a: any) => a.id !== ag.id);
                                                                    localStorage.setItem('crm_mensagens_agendadas', JSON.stringify(rest));
                                                                    setMensagens((prev) => [...prev]); // Force update
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-error hover:bg-error/10 rounded transition-all"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            <div className="flex items-end gap-1 px-1">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const type = file.type.startsWith('image/') ? 'imagem' : file.type.startsWith('audio/') ? 'audio' : 'arquivo';
                                        handleFileSelect(e, type);
                                    }}
                                />
                                <div className="flex gap-0.5">
                                    <button
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.accept = "image/*";
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-text-muted flex-shrink-0"
                                        title="Enviar Imagem"
                                    >
                                        <ImageIcon className="w-4.5 h-4.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (isRecording) {
                                                stopRecording();
                                            } else {
                                                startRecording();
                                            }
                                        }}
                                        className={cn(
                                            "w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0",
                                            isRecording ? "bg-error text-white animate-pulse" : "hover:bg-gray-100 text-text-muted"
                                        )}
                                        title={isRecording ? "Parar Gravação" : "Gravar Áudio"}
                                    >
                                        {isRecording ? <div className="w-3 h-3 bg-white rounded-full" /> : <Mic className="w-4.5 h-4.5" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.accept = "*/*";
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-text-muted flex-shrink-0"
                                        title="Enviar Arquivo"
                                    >
                                        <Paperclip className="w-4.5 h-4.5" />
                                    </button>
                                </div>

                                <div className="flex-1 relative mx-1">
                                    {isRecording ? (
                                        <div className="input flex items-center justify-between px-4 py-2.5 bg-error/5 border-error/20 h-[40px]">
                                            <div className="flex items-center gap-2 text-error">
                                                <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                                                <span className="text-xs font-bold font-mono">
                                                    {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                                                    {(recordingTime % 60).toString().padStart(2, '0')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={cancelRecording}
                                                className="text-text-muted hover:text-error transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <textarea
                                                value={novaMensagem}
                                                onChange={(e) => setNovaMensagem(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }}
                                                placeholder={isNoteMode ? "Escreva uma anotação..." : "Digite uma mensagem..."}
                                                rows={1}
                                                className={cn(
                                                    "input resize-none pr-10 py-2.5 text-sm transition-all",
                                                    isNoteMode ? "bg-white border-warning/40 focus:border-warning ring-warning/10" : "focus:border-primary",
                                                    showScheduling ? "ring-2 ring-primary/20" : ""
                                                )}
                                                style={{ minHeight: '40px', maxHeight: '120px' }}
                                            />
                                            <button className="absolute right-2 bottom-2 text-text-muted hover:text-primary transition-colors">
                                                <Smile className="w-4.5 h-4.5" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setShowScheduling(!showScheduling)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                            showScheduling ? "bg-primary text-white" : "hover:bg-gray-100 text-text-muted"
                                        )}
                                        title="Agendar Mensagem"
                                    >
                                        <CalendarPlus className="w-4.5 h-4.5" />
                                    </button>
                                    <button
                                        onClick={enviarMensagem}
                                        disabled={!novaMensagem.trim() && !selectedFile && !audioBlob}
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0 shadow-soft",
                                            isNoteMode ? "bg-warning text-white hover:bg-warning/80" : "bg-primary text-white hover:bg-primary-600"
                                        )}
                                    >
                                        {isNoteMode ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                            <Circle className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-text mb-1">Selecione uma conversa</h3>
                        <p className="text-sm text-text-muted">Escolha um contato para iniciar o atendimento</p>
                    </div>
                </div>
            )
            }

            {/* Modal de transferência */}
            {showTransferencia && leadAtivo && (
                <TransferenciaModal
                    leadNome={leadAtivo.nome}
                    onClose={() => setShowTransferencia(false)}
                    onConfirm={handleConfirmTransferencia}
                />
            )}

            {/* Modal de ganho */}
            {showGanhoModal && leadAtivo && (
                <GanhoVendaModal
                    leadNome={leadAtivo.nome}
                    onClose={() => setShowGanhoModal(false)}
                    onConfirm={handleGanho}
                />
            )}

            {/* Modal de Detalhes do Lead */}
            {showLeadDetailsModal && leadAtivo && (
                <LeadDetailsModal
                    lead={leadAtivo}
                    onClose={() => setShowLeadDetailsModal(false)}
                    onSave={handleSaveLeadDetails}
                />
            )}
        </div>
    );
}
