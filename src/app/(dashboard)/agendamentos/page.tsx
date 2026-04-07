'use client';

import { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import {
    FileText, MessageSquare, Mic, Play, Pause, Plus, Copy,
    Search, Trash2, Edit3, ChevronRight, X, Check,
    MicOff, Clock, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CopyCategory = 'FLUXO' | 'OBJECOES' | 'AUDIOS' | 'PROPOSTAS';

interface ScriptCopy {
    id: string;
    titulo: string;
    conteudo: string;
    categoria: CopyCategory;
    audioUrl?: string; // Para preview de áudio
    tags?: string[];
}

const COPYS_MOCK: ScriptCopy[] = [
    {
        id: '1',
        titulo: 'Saudação Inicial (Fonoaudiologia)',
        categoria: 'FLUXO',
        conteudo: 'Olá {nome}! Tudo bem? 💙 Sou a {atendente} aqui da CRM Clínica. Recebemos seu contato interessado em fonoaudiologia para seu filho. Para te ajudarmos melhor, qual a idade dele e qual a principal queixa no momento?',
        tags: ['Saudação', 'Fono']
    },
    {
        id: '2',
        titulo: 'Objeção: Valor da Sessão',
        categoria: 'OBJECOES',
        conteudo: 'Compreendo perfeitamente, {nome}. O valor reflete não apenas a sessão, mas toda a nossa infraestrutura multidisciplinar e o acompanhamento contínuo que oferecemos. Trabalhamos com pacotes que podem tornar o investimento mais acessível. Gostaria de conhecer?',
        tags: ['Preço', 'Valor']
    },
    {
        id: '3',
        titulo: 'Explicação TEA (Áudio)',
        categoria: 'AUDIOS',
        conteudo: 'Nossa abordagem para TEA foca no desenvolvimento da autonomia... (Script longo para gravação)',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        tags: ['TEA', 'Explicação']
    },
];

export default function CopysPage() {
    const [copys, setCopys] = useState<ScriptCopy[]>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('crm_copys') : null;
        return saved ? JSON.parse(saved) : COPYS_MOCK;
    });
    const [busca, setBusca] = useState('');
    const [categoriaAtiva, setCategoriaAtiva] = useState<CopyCategory | 'TODOS'>('TODOS');
    const [showModal, setShowModal] = useState(false);
    const [editingCopy, setEditingCopy] = useState<ScriptCopy | null>(null);
    const [showTeleprompter, setShowTeleprompter] = useState<ScriptCopy | null>(null);

    // Form states
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [categoria, setCategoria] = useState<CopyCategory>('FLUXO');
    const [audioUrl, setAudioUrl] = useState('');

    const saveCopys = (newList: ScriptCopy[]) => {
        setCopys(newList);
        localStorage.setItem('crm_copys', JSON.stringify(newList));
    };

    const handleSave = () => {
        if (!titulo || !conteudo) return;

        if (editingCopy) {
            saveCopys(copys.map(c => c.id === editingCopy.id ? { ...c, titulo, conteudo, categoria, audioUrl } : c));
        } else {
            const nova: ScriptCopy = {
                id: Date.now().toString(),
                titulo,
                conteudo,
                categoria,
                audioUrl
            };
            saveCopys([nova, ...copys]);
        }
        closeModal();
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCopy(null);
        setTitulo('');
        setConteudo('');
        setCategoria('FLUXO');
        setAudioUrl('');
    };

    const handleEdit = (copy: ScriptCopy) => {
        setEditingCopy(copy);
        setTitulo(copy.titulo);
        setConteudo(copy.conteudo);
        setCategoria(copy.categoria);
        setAudioUrl(copy.audioUrl || '');
        setShowModal(true);
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Script copiado para a área de transferência!');
    };

    const copysFiltradas = copys.filter(c => {
        const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) || c.conteudo.toLowerCase().includes(busca.toLowerCase());
        const matchCat = categoriaAtiva === 'TODOS' || c.categoria === categoriaAtiva;
        return matchBusca && matchCat;
    });

    return (
        <div className="animate-fade-in flex flex-col h-full bg-gray-50">
            <Header
                title="Copys & Scripts"
                subtitle={`${copys.length} modelos cadastrados`}
                actions={
                    <button onClick={() => setShowModal(true)} className="btn-primary py-1.5 px-3 text-xs gap-1.5 shadow-sm">
                        <Plus className="w-4 h-4" /> Novo Script
                    </button>
                }
            />

            {/* Filtros e Busca */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por título ou conteúdo..."
                        className="input pl-10"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {(['TODOS', 'FLUXO', 'OBJECOES', 'AUDIOS', 'PROPOSTAS'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaAtiva(cat)}
                            className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                                categoriaAtiva === cat
                                    ? 'bg-primary text-gray-900 border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white text-gray-400 border-gray-300 hover:border-primary/50 hover:text-primary'
                            )}
                        >
                            {cat === 'TODOS' ? 'Todos' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Copys */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {copysFiltradas.map(copy => (
                    <div key={copy.id} className="bg-white rounded-3xl border border-gray-200 group flex flex-col hover:border-primary/40 transition-all">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                                <span className={cn(
                                    'text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider mb-2 inline-block',
                                    copy.categoria === 'FLUXO' ? 'bg-blue-500/10 text-blue-400' :
                                        copy.categoria === 'OBJECOES' ? 'bg-amber-500/10 text-amber-400' :
                                            copy.categoria === 'AUDIOS' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-400'
                                )}>
                                    {copy.categoria}
                                </span>
                                <h3 className="text-sm font-bold text-text truncate">{copy.titulo}</h3>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(copy)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => saveCopys(copys.filter(c => c.id !== copy.id))} className="p-1.5 hover:bg-error/10 rounded-lg text-gray-500 hover:text-error">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 mb-4 border border-gray-200 overflow-hidden">
                            <p className="text-xs text-gray-400 italic leading-relaxed line-clamp-4">
                                "{copy.conteudo}"
                            </p>
                        </div>

                        {copy.audioUrl && (
                            <div className="mb-4 p-3 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                                <button className="w-8 h-8 rounded-full bg-primary text-gray-900 flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                </button>
                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="w-1/3 h-full bg-primary" />
                                </div>
                                <span className="text-[10px] font-bold text-primary">Preview Áudio</span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleCopyText(copy.conteudo)}
                                className="flex-1 btn-secondary py-2 text-xs gap-2 font-bold"
                            >
                                <Copy className="w-3.5 h-3.5" /> Copiar Script
                            </button>
                            {copy.categoria === 'AUDIOS' && (
                                <button
                                    onClick={() => setShowTeleprompter(copy)}
                                    className="btn-primary py-2 px-3 text-xs gap-2 shadow-soft hover:scale-[1.02]"
                                >
                                    <Mic className="w-3.5 h-3.5" /> Rec
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {copysFiltradas.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-base font-bold text-text mb-1">Nenhum script encontrado</p>
                        <p className="text-sm text-text-muted">Tente ajustar sua busca ou categoria</p>
                    </div>
                )}
            </div>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl border border-gray-200 shadow-2xl p-6 space-y-5 animate-slide-in-up">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-gray-900">{editingCopy ? 'Editar Script' : 'Novo Script de Vendas'}</h2>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-gray-100 text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Título do Script</label>
                                <input
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: Quebra de Objeção - Preço"
                                    className="input py-3"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Categoria</label>
                                <select
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value as CopyCategory)}
                                    className="input py-3 appearance-none"
                                >
                                    <option value="FLUXO">Fluxo de Conversa</option>
                                    <option value="OBJECOES">Quebra de Objeção</option>
                                    <option value="AUDIOS">Roteiro para Áudio</option>
                                    <option value="PROPOSTAS">Proposta de Venda</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1.5 block">Preview de Áudio (URL)</label>
                                <input
                                    value={audioUrl}
                                    onChange={(e) => setAudioUrl(e.target.value)}
                                    placeholder="Opcional"
                                    className="input py-3"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest block">Conteúdo do Script</label>
                                <span className="text-[10px] text-primary font-bold">Use {'{nome}'} para variáveis</span>
                            </div>
                            <textarea
                                value={conteudo}
                                onChange={(e) => setConteudo(e.target.value)}
                                placeholder="Escreva o texto do script aqui..."
                                className="input resize-none h-40 py-3"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={closeModal} className="flex-1 btn-ghost py-3 font-bold">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={!titulo || !conteudo}
                                className="flex-[2] btn-primary py-3 font-bold shadow-soft"
                            >
                                <Check className="w-5 h-5" /> {editingCopy ? 'Salvar Alterações' : 'Criar Script'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teleprompter Mode */}
            {showTeleprompter && (
                <div className="fixed inset-0 z-[60] flex flex-col bg-gray-900/95 backdrop-blur-xl animate-fade-in">
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-error animate-pulse" />
                            <h2 className="text-gray-900 font-bold uppercase tracking-widest text-sm">Modo Teleprompter: {showTeleprompter.titulo}</h2>
                        </div>
                        <button onClick={() => setShowTeleprompter(null)} className="text-gray-900/60 hover:text-gray-900 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                        <div className="max-w-3xl w-full">
                            <p className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight animate-scroll-up">
                                {showTeleprompter.conteudo}
                            </p>
                        </div>
                    </div>

                    <div className="p-10 border-t border-white/10 bg-black/40 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-8">
                            <div className="text-center">
                                <p className="text-gray-900/40 text-[10px] font-bold uppercase mb-1">Tempo</p>
                                <p className="text-2xl font-mono text-gray-900">00:15</p>
                            </div>
                            <button className="w-20 h-20 rounded-full bg-error flex items-center justify-center shadow-[0_0_30px_rgba(234,67,53,0.4)] hover:scale-105 transition-transform">
                                <MicOff className="w-8 h-8 text-gray-900" />
                            </button>
                            <div className="text-center">
                                <p className="text-gray-900/40 text-[10px] font-bold uppercase mb-1">Status</p>
                                <p className="text-sm font-bold text-error">GRAVANDO...</p>
                            </div>
                        </div>
                        <div className="max-w-md w-full flex items-center gap-4 text-gray-900/60">
                            <ChevronRight className="w-5 h-5" />
                            <p className="text-xs">Dica: Mantenha um tom de voz acolhedor e pausado. Lembre-se de sorrir enquanto fala!</p>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes scroll-up {
                    from { transform: translateY(20%); opacity: 0.3; }
                    to { transform: translateY(-10%); opacity: 1; }
                }
                .animate-scroll-up {
                    animation: scroll-up 10s linear infinite alternate;
                }
            `}</style>
        </div>
    );
}
