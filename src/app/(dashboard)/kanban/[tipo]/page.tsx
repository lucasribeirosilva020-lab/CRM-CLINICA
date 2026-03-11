'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { cn, formatTempo, getAvatarUrl, minutosDesde, formatDuracao } from '@/lib/utils';
import {
    Clock, MoreVertical, Plus, Settings2, GripVertical, MessageSquare,
    User, X, Send, Paperclip, Check, MessageCircle, Mic, Image as ImageIcon,
    CalendarPlus, Play, Pause, Download as DownloadIcon, Smile
} from 'lucide-react';
import {
    DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
    PointerSensor, useSensor, useSensors, DragOverlay, closestCorners,
} from '@dnd-kit/core';
import {
    SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DropdownMenu from '@/components/ui/DropdownMenu';
import GanhoVendaModal from '@/components/modals/GanhoVendaModal';
import LeadDetailsModal from '@/components/modals/LeadDetailsModal';
import ColunaModal from '@/components/modals/ColunaModal';
import { uploadFileToStorage } from '@/lib/storage';

type TipoBoard = 'ATENDIMENTO' | 'VENDAS' | 'LTVS';

interface KanbanCard {
    id: string;
    nome: string;
    telefone: string;
    colunaId: string;
    atribuidoA?: string;
    ultimaMensagem?: string;
    ultimaMensagemAt?: string;
    minutosSemResposta: number;
    prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
    tags?: string[];
    valor?: number;
    busca?: string;
    pagamento?: string;
}

interface KanbanColuna {
    id: string;
    slug: string;
    nome: string;
    cor: string;
    ordem: number;
    cards: KanbanCard[];
}

// Usaremos os estados para colunas reais buscadas do banco

const TAG_COLORS: Record<string, string> = {
    'Google ADS': 'bg-blue-100 text-blue-700 border-blue-200',
    'Facebook ADS': 'bg-pink-100 text-pink-700 border-pink-200',
    'Instagram ads': 'bg-purple-100 text-purple-700 border-purple-200',
    'Indicação': 'bg-green-100 text-green-700 border-green-200',
    'Ganho': 'bg-success/10 text-success border-success/20',
    'Perdido': 'bg-error/10 text-error border-error/20',
    'Desqualificado': 'bg-gray-100 text-gray-600 border-gray-200',
};

function getSlaStyle(minutos: number) {
    if (minutos >= 60) return 'border-error/60 shadow-[0_0_0_2px_rgba(234,67,53,0.15)]';
    if (minutos >= 30) return 'border-warning/60 shadow-[0_0_0_2px_rgba(251,188,4,0.15)]';
    return 'border-border';
}

function CardKanban({ card, isDragging, onSelect, onGanho, onEdit, showValue = true }: { card: KanbanCard; isDragging?: boolean; onSelect?: (c: KanbanCard) => void, onGanho?: (c: KanbanCard) => void, onEdit?: (c: KanbanCard) => void, showValue?: boolean }) {
    const slaClass = getSlaStyle(card.minutosSemResposta);
    const prioridadeCores: Record<string, string> = {
        BAIXA: 'bg-gray-100 text-gray-500',
        NORMAL: 'bg-secondary text-primary',
        ALTA: 'bg-warning/10 text-warning',
        URGENTE: 'bg-error/10 text-error',
    };

    return (
        <div
            onClick={() => !isDragging && onSelect && onSelect(card)}
            className={cn(
                'bg-white rounded-xl border p-3 cursor-pointer active:cursor-grabbing transition-all',
                slaClass,
                isDragging ? 'opacity-50 rotate-1 shadow-modal' : 'shadow-soft hover:shadow-card hover:border-primary/50'
            )}>
            <div className="flex items-start gap-2 mb-2">
                <img src={getAvatarUrl(card.nome, 32)} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{card.nome}</p>
                    <p className="text-[10px] text-text-muted">{card.telefone}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                        trigger={
                            <button className="text-text-muted hover:text-text flex-shrink-0 p-1">
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                        }
                        items={[
                            { label: 'Editar Lead', icon: User, onClick: () => onEdit?.(card) },
                            { label: 'Abrir Conversa', icon: MessageCircle, onClick: () => (window.location.href = `/conversas?lead=${card.id}`) },
                            { label: 'Dar Ganho', icon: Check, onClick: () => onGanho?.(card) },
                        ]}
                    />
                </div>
            </div>

            {card.ultimaMensagem && (
                <p className="text-[11px] text-text-muted truncate flex items-center gap-1 mb-2">
                    <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" />
                    {card.ultimaMensagem}
                </p>
            )}

            <div className="flex items-center gap-1 flex-wrap mb-2">
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-md', prioridadeCores[card.prioridade])}>
                    {card.prioridade}
                </span>
                {card.tags?.map(tag => (
                    <span key={tag} className={cn('text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap', TAG_COLORS[tag] || 'bg-gray-100')}>
                        {tag}
                    </span>
                ))}
                {card.busca && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded border border-secondary text-primary bg-secondary/30 whitespace-nowrap italic">
                        {card.busca}
                    </span>
                )}
            </div>

            {showValue && card.valor && (
                <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-lg border border-success/20">
                        R$ {card.valor.toLocaleString('pt-BR')}
                    </span>
                    {card.pagamento && (
                        <span className="text-[9px] text-text-muted font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-border">
                            {card.pagamento}
                        </span>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap text-text-muted mt-auto pt-2 border-t border-gray-50">
                {card.minutosSemResposta > 0 && (
                    <span className={cn(
                        'text-[9px] flex items-center gap-0.5 font-medium',
                        card.minutosSemResposta >= 60 ? 'text-error' : card.minutosSemResposta >= 30 ? 'text-warning' : 'text-text-muted'
                    )}>
                        <Clock className="w-2.5 h-2.5" />
                        {card.minutosSemResposta}min
                    </span>
                )}
                {card.atribuidoA && (
                    <span className="ml-auto text-[9px] flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5" />
                        Atribuído: {card.atribuidoA}
                    </span>
                )}
            </div>
        </div>
    );
}

function SortableCard({ card, onSelect, onGanho, onEdit, showValue }: { card: KanbanCard; onSelect: (c: KanbanCard) => void, onGanho: (c: KanbanCard) => void, onEdit: (c: KanbanCard) => void, showValue: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <CardKanban card={card} isDragging={isDragging} onSelect={onSelect} onGanho={onGanho} onEdit={onEdit} showValue={showValue} />
        </div>
    );
}

function Coluna({ coluna, isAdmin, onSelect, onGanho, onEdit, showValue, onEditColuna, onDeleteColuna, onMoveColuna }: {
    coluna: KanbanColuna;
    isAdmin: boolean;
    onSelect: (c: KanbanCard) => void;
    onGanho: (c: KanbanCard) => void;
    onEdit: (c: KanbanCard) => void;
    showValue: boolean;
    onEditColuna?: (c: KanbanColuna) => void;
    onDeleteColuna?: (c: KanbanColuna) => void;
    onMoveColuna?: (c: KanbanColuna, direction: -1 | 1) => void;
}) {
    return (
        <div className="flex-shrink-0 w-72 flex flex-col bg-gray-50/80 rounded-xl border border-border">
            {/* Header da coluna */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: coluna.cor }} />
                <span className="text-xs font-bold text-text flex-1 truncate">{coluna.nome}</span>
                <span className="text-[10px] font-semibold text-text-muted bg-white border border-border px-1.5 py-0.5 rounded-full">
                    {coluna.cards.length}
                </span>
                {isAdmin && (
                    <DropdownMenu
                        trigger={
                            <button className="text-text-muted hover:text-text transition-colors p-1 rounded-md hover:bg-gray-100" title="Configurar coluna">
                                <Settings2 className="w-3.5 h-3.5" />
                            </button>
                        }
                        items={[
                            { label: 'Editar Coluna', onClick: () => onEditColuna?.(coluna) },
                            { label: 'Mover para Esquerda', onClick: () => onMoveColuna?.(coluna, -1) },
                            { label: 'Mover para Direita', onClick: () => onMoveColuna?.(coluna, 1) },
                            { label: 'Excluir Coluna', onClick: () => onDeleteColuna?.(coluna), variant: 'danger' }
                        ]}
                    />
                )}
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 min-h-[100px]">
                <SortableContext items={coluna.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {coluna.cards.map((card) => (
                        <SortableCard key={card.id} card={card} onSelect={onSelect} onGanho={onGanho} onEdit={onEdit} showValue={showValue} />
                    ))}
                </SortableContext>
                {coluna.cards.length === 0 && (
                    <div className="h-16 flex items-center justify-center border-2 border-dashed border-border rounded-xl text-xs text-text-light">
                        Sem cards visíveis
                    </div>
                )}
            </div>
        </div>
    );
}

export default function KanbanPage({ params }: { params: { tipo: string } }) {
    const { usuario, isAdmin, isVendedor, isAtendente } = useAuth();
    const tipoUrl = params.tipo?.toUpperCase();
    const boardType = tipoUrl === 'VENDAS' ? 'VENDAS' : (tipoUrl === 'LTVS' ? 'LTVS' : 'ATENDIMENTO');

    const [colunas, setColunas] = useState<KanbanColuna[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);
    const [leadSelecionado, setLeadSelecionado] = useState<KanbanCard | null>(null);
    const [leadParaGanho, setLeadParaGanho] = useState<KanbanCard | null>(null);
    const [leadParaDetalhes, setLeadParaDetalhes] = useState<KanbanCard | null>(null);
    const [showGanhoModal, setShowGanhoModal] = useState(false);
    const [colunaModalOpen, setColunaModalOpen] = useState(false);
    const [colunaEmEdicao, setColunaEmEdicao] = useState<KanbanColuna | null>(null);

    const [mensagensLocais, setMensagensLocais] = useState<any[]>([
        { id: 'm1', de: 'lead', texto: 'Olá, gostaria de saber mais...', timestamp: new Date(Date.now() - 10000).toISOString() },
        { id: 'm2', de: 'sistema', texto: 'Claro, como posso ajudar?', timestamp: new Date().toISOString() }
    ]);

    // Estados para o Chat Avançado
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

    const handleSalvarColuna = async (nome: string, cor: string, id?: string) => {
        try {
            if (id) {
                const res = await fetch(`/api/kanban/colunas/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, cor })
                });
                if (res.ok) { fetchBoard(); return true; }
            } else {
                const res = await fetch(`/api/kanban/colunas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, cor, tipo: boardType })
                });
                if (res.ok) { fetchBoard(); return true; }
            }
            alert('Erro ao salvar coluna.');
            return false;
        } catch (e) {
            console.error('Erro ao salvar coluna:', e);
            return false;
        }
    };

    const handleDeleteColuna = async (col: KanbanColuna) => {
        if (!confirm(`Tem certeza que deseja excluir a coluna "${col.nome}"?`)) return;
        try {
            const res = await fetch(`/api/kanban/colunas/${col.id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                fetchBoard();
            } else {
                alert(json.error || 'Erro ao excluir coluna.');
            }
        } catch (e) {
            console.error('Erro ao excluir coluna:', e);
        }
    };

    const handleMoveColuna = async (col: KanbanColuna, dir: -1 | 1) => {
        const index = colunas.findIndex((c: any) => c.id === col.id);
        if (index === -1) return;
        const newIndex = index + dir;
        if (newIndex < 0 || newIndex >= colunas.length) return;

        const novasColunas = [...colunas];
        const currentOrdem = novasColunas[index].ordem;
        novasColunas[index].ordem = novasColunas[newIndex].ordem;
        novasColunas[newIndex].ordem = currentOrdem;

        const atualizadas = novasColunas.map((c: any) => ({ id: c.id, ordem: c.ordem }));

        try {
            setColunas([...novasColunas].sort((a: any, b: any) => a.ordem - b.ordem));
            await fetch('/api/kanban/colunas', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ colunas: atualizadas })
            });
            fetchBoard();
        } catch (e) { console.error('Erro ao mover coluna:', e); }
    };

    const fetchBoard = async () => {
        try {
            setLoading(true);
            const [leadsRes, colunasRes] = await Promise.all([
                fetch(`/api/leads`).then(res => res.json()),
                fetch(`/api/kanban/colunas?tipo=${boardType}`).then(res => res.json())
            ]);

            if (leadsRes.success && colunasRes.success) {
                const field = boardType === 'ATENDIMENTO' ? 'kanbanAtenStat' : 'kanbanVendStat';

                const colunasMontadas = colunasRes.data.map((col: any) => ({
                    id: col.id,
                    slug: col.slug,
                    nome: col.nome,
                    cor: col.cor,
                    ordem: col.ordem,
                    cards: leadsRes.data.filter((l: any) => l[field] === col.slug)
                }));

                setColunas(colunasMontadas);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
    }, [boardType]);

    const [mensagemInput, setMensagemInput] = useState('');
    const [mensagemAgendamento, setMensagemAgendamento] = useState('');
    const enviarMensagem = async () => {
        if ((!mensagemInput.trim() && !selectedFile && !audioBlob) || !leadSelecionado) return;

        let urlUpload = '';

        try {
            // Upload para o Supabase Storage se houver arquivo
            if (audioBlob || selectedFile) {
                if (audioBlob) {
                    const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                    urlUpload = await uploadFileToStorage(file, `kanban/${leadSelecionado.id}/audio_${Date.now()}.webm`);
                } else if (selectedFile) {
                    urlUpload = await uploadFileToStorage(selectedFile, `kanban/${leadSelecionado.id}/${Date.now()}_${selectedFile.name}`);
                }
            }

            const payload = {
                conteudo: mensagemInput || (selectedFile?.name || 'Áudio'),
                tipo: fileType?.toUpperCase() || 'TEXTO',
                de: 'sistema',
                url: urlUpload || undefined,
                nomeArquivo: selectedFile?.name || (audioBlob ? 'audio.webm' : undefined)
            };

            const res = await fetch(`/api/leads/${leadSelecionado.id}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (json.success) {
                // Atualizar mensagens locais se o lead ainda for o mesmo
                const currentMsgs = [...mensagensLocais, {
                    ...json.data,
                    texto: json.data.conteudo // Adaptar para o campo esperado pelo painel do Kanban
                }];
                setMensagensLocais(currentMsgs);
                
                setMensagemInput('');
                setFilePreview(null);
                setSelectedFile(null);
                setFileType(null);
                setAudioBlob(null);
                setRecordingTime(0);
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem com anexo:', error);
            alert('Falha ao enviar mensagem. Por favor, verifique o console do navegador e do servidor.');
        }
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
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(file.name);
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
        agendadas.push({ ...scheduledMsg, leadId: leadSelecionado?.id, leadNome: leadSelecionado?.nome });
        localStorage.setItem(key, JSON.stringify(agendadas));

        alert(`Mensagem agendada para ${scheduledDate} às ${scheduledTime}`);
        setShowScheduling(false);
        setMensagemAgendamento('');
        setFilePreview(null);
        setSelectedFile(null);
        setFileType(null);
    };

    // Efeito para sincronizar mensagens com localStorage no Kanban
    useEffect(() => {
        if (!leadSelecionado) return;

        const loadMessages = () => {
            const localMsgs = JSON.parse(localStorage.getItem(`crm_chat_msgs_${leadSelecionado.id}`) || 'null');
            if (localMsgs) {
                setMensagensLocais(localMsgs);
            } else {
                setMensagensLocais([]); // Ou carregar mock se preferir
            }
        };

        loadMessages();
        window.addEventListener('storage', loadMessages);
        return () => window.removeEventListener('storage', loadMessages);
    }, [leadSelecionado]);

    // Efeito para verificar agendamentos no Kanban
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
                    const nova = {
                        id: `sch-exec-${Date.now()}-${Math.random()}`,
                        texto: msg.conteudo,
                        de: 'sistema',
                        timestamp: new Date().toISOString(),
                        tipo: msg.tipo,
                        url: msg.arquivo ? '#' : undefined,
                        nomeArquivo: msg.arquivo
                    };

                    const key = `crm_chat_msgs_${msg.leadId}`;
                    const chatMsgs = JSON.parse(localStorage.getItem(key) || 'null') || [];
                    const updatedChat = [...chatMsgs, nova];
                    localStorage.setItem(key, JSON.stringify(updatedChat));

                    if (leadSelecionado?.id === msg.leadId) {
                        setMensagensLocais(updatedChat);
                    }
                });

                localStorage.setItem(`crm_mensagens_agendadas_${usuario?.clinica?.id || 'anon'}`, JSON.stringify(restantes));
            }
        };

        const interval = setInterval(checkScheduled, 20000);
        return () => clearInterval(interval);
    }, [leadSelecionado]);

    // Filtragem por perfil
    const colunasFiltradas = colunas.map((col: any) => ({
        ...col,
        cards: col.cards.filter((card: any) => {
            if (isAdmin) return true;
            if (boardType === 'ATENDIMENTO') {
                if (isAtendente) {
                    // Atendente só vê quem já é cliente (Ganho) ou se for explicitamente atribuído por suporte
                    return card.tags?.includes('Ganho') || card.atribuidoA === usuario?.id;
                }
                return true;
            }
            if (boardType === 'VENDAS') {
                if (isVendedor) {
                    // Vendedor só vê leads atribuídos a ele
                    return card.atribuidoA === usuario?.id;
                }
                return isAdmin; // Admin vê todos
            }
            if (boardType === 'LTVS') {
                return isAdmin || isVendedor; // Admin e Vendedores vêm LTVs
            }
            return false;
        })
    }));

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    function findColuna(cardId: string) {
        return colunasFiltradas.find((col: any) => col.cards.some((c: any) => c.id === cardId));
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const coluna = findColuna(active.id as string);
        const card = coluna?.cards.find((c: any) => c.id === active.id);
        if (card) setActiveCard(card);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveCard(null);

        if (!over) return;

        const activeColuna = findColuna(active.id as string);
        const overColuna = colunasFiltradas.find((col: any) => col.id === over.id) || findColuna(over.id as string);

        if (!activeColuna || !overColuna) return;

        if (activeColuna.id !== overColuna.id) {
            // Mover para outra coluna
            const card = activeColuna.cards.find((c: any) => c.id === active.id)!;

            // Persistir no banco via API
            const updateField = boardType === 'ATENDIMENTO' ? 'kanbanAtenStat' : 'kanbanVendStat';

            try {
                const res = await fetch(`/api/leads/${card.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [updateField]: overColuna.slug })
                });
                const json = await res.json();
                if (json.success) {
                    fetchBoard(); // Recarregar do banco para garantir consistência
                } else {
                    alert('Erro ao mover lead: ' + json.error);
                }
            } catch (error) {
                console.error('Erro ao mover lead:', error);
            }
        }
    }

    const handleSaveLeadDetails = async (data: any) => {
        if (!leadParaDetalhes) return;

        try {
            const res = await fetch(`/api/leads/${leadParaDetalhes.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (json.success) {
                fetchBoard();
                setLeadParaDetalhes(null);
            }
        } catch (error) {
            console.error('Erro ao atualizar lead:', error);
        }
    };

    const handleGanho = async (valor: number, vendedorId: string, servico: string, origem: string, pagamento: string) => {
        if (!leadParaGanho) return;

        try {
            const res = await fetch(`/api/leads/${leadParaGanho.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    valor,
                    pagamento,
                    kanbanVendStat: 'ganho',
                    tags: Array.from(new Set([...(leadParaGanho.tags || []), 'Ganho', origem]))
                })
            });
            const json = await res.json();
            if (json.success) {
                fetchBoard();
                setShowGanhoModal(false);
                setLeadParaGanho(null);
                alert(`Venda registrada com sucesso!`);
            }
        } catch (error) {
            console.error('Erro ao registrar ganho:', error);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <Header
                title={`Kanban ${boardType === 'VENDAS' ? 'de Vendas' : 'de Atendimento'}`}
                subtitle={`${colunas.reduce((acc: any, c: any) => acc + c.cards.length, 0)} cards no total`}
                actions={
                    isAdmin ? (
                        <button
                            onClick={() => { setColunaEmEdicao(null); setColunaModalOpen(true); }}
                            className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nova Coluna
                        </button>
                    ) : null
                }
            />

            {/* Tabs */}
            <div className="flex gap-1 px-4 py-2 bg-white border-b border-border">
                {[
                    { key: 'ATENDIMENTO', label: 'Atendimento' },
                    { key: 'VENDAS', label: 'Vendas' },
                    { key: 'LTVS', label: 'LTVs' }
                ].map((tab) => (
                    <a
                        key={tab.key}
                        href={`/kanban/${tab.key.toLowerCase()}`}
                        className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                            boardType === tab.key
                                ? 'bg-secondary text-primary'
                                : 'text-text-muted hover:text-text hover:bg-gray-50'
                        )}
                    >
                        {tab.label}
                    </a>
                ))}
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-xs text-text-muted">
                        Carregando board...
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 h-full" style={{ width: 'max-content' }}>
                            {colunasFiltradas.map((coluna: any) => (
                                <Coluna
                                    key={coluna.id}
                                    coluna={coluna}
                                    isAdmin={!!isAdmin}
                                    onSelect={setLeadSelecionado}
                                    onGanho={(c: any) => { setLeadParaGanho(c); setShowGanhoModal(true); }}
                                    onEdit={setLeadParaDetalhes}
                                    showValue={boardType !== 'ATENDIMENTO'}
                                    onEditColuna={(c) => { setColunaEmEdicao(c); setColunaModalOpen(true); }}
                                    onDeleteColuna={handleDeleteColuna}
                                    onMoveColuna={handleMoveColuna}
                                />
                            ))}
                            {isAdmin && (
                                <button
                                    onClick={() => { setColunaEmEdicao(null); setColunaModalOpen(true); }}
                                    className="flex-shrink-0 w-72 h-16 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-all text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Coluna
                                </button>
                            )}
                        </div>

                        <DragOverlay>
                            {activeCard && (
                                <div className="rotate-2 scale-105 opacity-90">
                                    <CardKanban card={activeCard} />
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}
            </div>
            {/* Modal/Painel Lateral de Atendimento */}
            {leadSelecionado && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
                    <div className="w-full sm:w-[400px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right transform transition-transform">
                        {/* Header do Painel */}
                        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                            <img src={getAvatarUrl(leadSelecionado.nome, 40)} className="w-10 h-10 rounded-full" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-text truncate">{leadSelecionado.nome}</p>
                                <p className="text-xs text-text-muted">{leadSelecionado.telefone}</p>
                            </div>
                            <button
                                onClick={() => setLeadSelecionado(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-text-muted"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Abas: Chat e Info */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-border text-xs">
                                <h4 className="font-bold text-text mb-1">Anotações Internas</h4>
                                <p className="text-text-muted leading-relaxed">
                                    Paciente agendou avaliação inicial. Preferência de horário: Manhã.
                                    Já enviou a carteirinha do convênio por foto (salvo no drive).
                                </p>
                            </div>

                            {/* Área do Chat */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                {mensagensLocais.map((msg, i) => {
                                    const isMe = msg.de === 'sistema';

                                    if (msg.tipo === 'audio') {
                                        return (
                                            <div key={msg.id || i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                                <div className={cn('max-w-[85%] px-3 py-2 rounded-2xl shadow-sm flex items-center gap-3', isMe ? 'bg-primary text-white' : 'bg-white text-text border border-border')}>
                                                    <button
                                                        onClick={() => {
                                                            const audio = document.getElementById(`audio-kanban-${msg.id}`) as HTMLAudioElement;
                                                            if (playingId === msg.id) {
                                                                audio.pause();
                                                                setPlayingId(null);
                                                            } else {
                                                                if (playingId) {
                                                                    const other = document.getElementById(`audio-kanban-${playingId}`) as HTMLAudioElement;
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
                                                        id={`audio-kanban-${msg.id}`}
                                                        src={msg.url}
                                                        onEnded={() => setPlayingId(null)}
                                                        onPause={() => playingId === msg.id && setPlayingId(null)}
                                                        className="hidden"
                                                    />
                                                    <div className="flex-1 min-w-[100px]">
                                                        <div className="h-1 bg-current opacity-20 rounded-full w-full mb-1" />
                                                        <span className="text-[10px] font-medium">{msg.duracao || '0:12'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (msg.tipo === 'imagem') {
                                        return (
                                            <div key={msg.id || i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                                                <div className={cn('max-w-[85%] p-1 rounded-2xl border bg-white shadow-soft')}>
                                                    <img src={msg.url} className="rounded-xl max-h-[200px] object-cover" alt="Imagem" />
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={msg.id || i} className={cn("flex", isMe ? 'justify-end' : 'justify-start')}>
                                            <div className={cn(
                                                "max-w-[85%] px-3 py-2 rounded-2xl text-sm",
                                                isMe
                                                    ? 'bg-primary text-white rounded-br-sm'
                                                    : 'bg-white border border-border text-text rounded-bl-sm shadow-sm'
                                            )}>
                                                {msg.texto}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Files Preview */}
                            {(filePreview || isRecording) && (
                                <div className="px-4 py-3 bg-white border-t border-border animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-dashed border-border">
                                        <div className="flex items-center gap-3">
                                            {fileType === 'imagem' ? (
                                                <img src={filePreview!} className="w-12 h-12 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    {fileType === 'audio' ? <Mic className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text truncate max-w-[150px]">
                                                    {isRecording ? 'Gravando áudio...' : (selectedFile?.name || 'Áudio gravado')}
                                                </span>
                                                {fileType === 'audio' && (
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                                                        {(recordingTime % 60).toString().padStart(2, '0')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {fileType === 'audio' && !isRecording && (
                                                <button
                                                    onClick={() => {
                                                        const audio = previewAudioRef.current;
                                                        if (audio) {
                                                            if (playingPreview) audio.pause();
                                                            else audio.play();
                                                            setPlayingPreview(!playingPreview);
                                                        }
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-secondary text-primary flex items-center justify-center"
                                                >
                                                    {playingPreview ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={isRecording ? cancelRecording : () => {
                                                    setFilePreview(null);
                                                    setSelectedFile(null);
                                                    setAudioBlob(null);
                                                }}
                                                className="p-1 px-2 rounded-lg hover:bg-error/10 text-text-muted hover:text-error transition-all text-[10px] font-bold"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                        {fileType === 'audio' && filePreview && (
                                            <audio
                                                ref={previewAudioRef}
                                                src={filePreview}
                                                onEnded={() => setPlayingPreview(false)}
                                                className="hidden"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Scheduling Modal Inline */}
                            {showScheduling && (
                                <div className="px-4 py-4 bg-primary/5 border-t border-primary/20 animate-fade-in">
                                    <div className="flex items-center justify-between mb-3 text-primary">
                                        <h4 className="text-xs font-bold flex items-center gap-2">
                                            <CalendarPlus className="w-4 h-4" /> Agendar Mensagem
                                        </h4>
                                        <button onClick={() => setShowScheduling(false)} className="text-text-muted hover:text-primary">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input
                                            type="date"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            className="input py-2 text-xs"
                                        />
                                        <input
                                            type="time"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            className="input py-2 text-xs"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <textarea
                                            value={mensagemAgendamento}
                                            onChange={(e) => setMensagemAgendamento(e.target.value)}
                                            placeholder="Mensagem do agendamento..."
                                            className="input py-2 text-xs resize-none h-16"
                                        />
                                    </div>
                                    <button
                                        onClick={handleScheduleMessage}
                                        className="btn-primary w-full py-2 text-xs mb-4"
                                    >
                                        Agendar para este lead
                                    </button>

                                    {/* Lista de Agendados no Kanban */}
                                    {(() => {
                                        const agendadas = JSON.parse(localStorage.getItem('crm_mensagens_agendadas') || '[]');
                                        const doLead = agendadas.filter((a: any) => a.leadId === leadSelecionado.id);
                                        if (doLead.length === 0) return null;

                                        return (
                                            <div className="border-t border-border pt-3">
                                                <p className="text-[10px] font-bold text-primary uppercase mb-2">
                                                    Próximos Envios ({doLead.length})
                                                </p>
                                                <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                                    {doLead.map((ag: any) => (
                                                        <div key={ag.id} className="bg-gray-50 border border-border rounded-lg p-2 flex items-center justify-between group">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] text-text font-medium truncate">{ag.conteudo}</p>
                                                                <p className="text-[8px] text-text-muted flex items-center gap-1 font-bold">
                                                                    {new Date(ag.data + 'T' + ag.hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const rest = agendadas.filter((a: any) => a.id !== ag.id);
                                                                    localStorage.setItem('crm_mensagens_agendadas', JSON.stringify(rest));
                                                                    setMensagensLocais((prev) => [...prev]);
                                                                }}
                                                                className="opacity-0 group-hover:opacity-100 p-0.5 text-error"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Input do Chat */}
                            <div className="p-3 bg-white border-t border-border">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        const type = e.target.accept.includes('image') ? 'imagem' : 'arquivo';
                                        handleFileSelect(e, type);
                                    }}
                                />
                                <div className="flex items-end gap-2">
                                    <div className="flex items-center gap-1">
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
                                                if (isRecording) stopRecording();
                                                else startRecording();
                                            }}
                                            className={cn(
                                                "w-9 h-9 flex items-center justify-center rounded-xl transition-all flex-shrink-0",
                                                isRecording ? "bg-error text-white animate-pulse" : "hover:bg-gray-100 text-text-muted"
                                            )}
                                        >
                                            {isRecording ? <div className="w-3 h-3 bg-white rounded-lg" /> : <Mic className="w-4.5 h-4.5" />}
                                        </button>
                                        <button
                                            onClick={() => setShowScheduling(!showScheduling)}
                                            className={cn(
                                                "w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 flex-shrink-0 transition-colors",
                                                showScheduling ? "text-primary bg-primary/10" : "text-text-muted"
                                            )}
                                        >
                                            <CalendarPlus className="w-4.5 h-4.5" />
                                        </button>
                                    </div>

                                    <div className="flex-1 relative">
                                        <textarea
                                            value={mensagemInput}
                                            onChange={(e) => setMensagemInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }}
                                            placeholder="Digite uma mensagem..."
                                            rows={1}
                                            className="input resize-none py-2 text-sm w-full pr-10"
                                            style={{ minHeight: '38px', maxHeight: '100px' }}
                                        />
                                        <button className="absolute right-2 bottom-2 text-text-muted hover:text-primary">
                                            <Smile className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={enviarMensagem}
                                        disabled={!mensagemInput.trim() && !selectedFile && !audioBlob}
                                        className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 flex-shrink-0"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showGanhoModal && leadParaGanho && (
                <GanhoVendaModal
                    leadNome={leadParaGanho.nome}
                    onClose={() => setShowGanhoModal(false)}
                    onConfirm={handleGanho}
                />
            )}

            {leadParaDetalhes && (
                <LeadDetailsModal
                    lead={leadParaDetalhes as any}
                    onClose={() => setLeadParaDetalhes(null)}
                    onSave={handleSaveLeadDetails}
                />
            )}

            <ColunaModal
                isOpen={colunaModalOpen}
                onClose={() => { setColunaModalOpen(false); setColunaEmEdicao(null); }}
                coluna={colunaEmEdicao}
                tipo={boardType as 'ATENDIMENTO' | 'VENDAS'}
                onSalvar={handleSalvarColuna}
            />
        </div>
    );
}
