'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, DollarSign, Search, Tag, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadDetailsModalProps {
    lead: {
        id: string;
        nome: string;
        telefone: string;
        valor?: number;
        busca?: string;
        tags: string[];
    };
    onClose: () => void;
    onSave: (data: {
        nome: string;
        telefone: string;
        valor: number;
        busca: string;
        tags: string[];
    }) => void;
}

const TAG_OPTIONS = [
    'Google ADS',
    'Facebook ADS',
    'Instagram ads',
    'Indicação',
];

export default function LeadDetailsModal({ lead, onClose, onSave }: LeadDetailsModalProps) {
    const [nome, setNome] = useState(lead.nome);
    const [telefone, setTelefone] = useState(lead.telefone);
    const [valor, setValor] = useState(lead.valor?.toString() || '');
    const [busca, setBusca] = useState(lead.busca || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(lead.tags || []);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            nome,
            telefone,
            valor: parseFloat(valor) || 0,
            busca,
            tags: selectedTags
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in text-text">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-lg font-bold">Informações do Lead</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Nome e Telefone */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                <User className="w-3 h-3 text-primary" /> Nome do Lead
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="input py-2 text-sm"
                                placeholder="Nome completo"
                                required
                            />
                        </div>
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                <Phone className="w-3 h-3 text-primary" /> Telefone / WhatsApp
                            </label>
                            <input
                                type="text"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                className="input py-2 text-sm"
                                placeholder="(00) 00000-0000"
                                required
                            />
                        </div>
                    </div>

                    {/* Valor e Busca */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-primary" /> Valor (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                className="input py-2 text-sm font-bold"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                <Search className="w-3 h-3 text-primary" /> O que busca?
                            </label>
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="input py-2 text-sm"
                                placeholder="Ex: TDAH Infantil"
                            />
                        </div>
                    </div>

                    {/* Tags / Origem */}
                    <div>
                        <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                            <Tag className="w-3 h-3 text-primary" /> Etiquetas de Origem
                        </label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {TAG_OPTIONS.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                        selectedTags.includes(tag)
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-white text-text-muted border-border hover:border-primary/50"
                                    )}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex gap-3">
                        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                            Estas informações ajudam na qualificação do lead e no acompanhamento do pipeline de vendas.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-outline flex-1 justify-center py-2 text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 justify-center py-2 text-sm gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
