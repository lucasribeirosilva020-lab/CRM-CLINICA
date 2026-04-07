'use client';

import { useState } from 'react';
import { X, Save, User, Phone, Mail, Heart, Shield } from 'lucide-react';

interface ClienteModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
}

export default function ClienteModal({ onClose, onSave }: ClienteModalProps) {
    const [formData, setFormData] = useState({
        nomePaciente: '',
        nomeResponsavel: '',
        telefone: '',
        email: '',
        diagnostico: '',
        cidCode: '',
        tipoPagamento: 'PARTICULAR',
        valorMensal: '',
        convenioNome: '',
        convenioValidade: '',
        convenioCarteira: '',
        terapias: [] as string[],
        terapiasOutros: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: Date.now().toString(),
            ativo: true,
            totalGasto: 0,
        });
    };

    const terapiasDisponiveis = [
        { id: 'FONOAUDIOLOGIA', label: 'Fonoaudiologia' },
        { id: 'PSICOLOGIA', label: 'Psicologia' },
        { id: 'TERAPIA_OCUPACIONAL', label: 'T. Ocupacional' },
        { id: 'PSICOPEDAGOGIA', label: 'Psicopedagogia' },
        { id: 'MUSICOTERAPIA', label: 'Musicoterapia' },
        { id: 'AVALIACAO_NEURO', label: 'Aval. Neuropsicológica' },
        { id: 'ARTETERAPIA', label: 'Arteterapia' },
        { id: 'PSICOMOTRICIDADE', label: 'Psicomotricidade' },
        { id: 'FISIOTERAPIA', label: 'Fisioterapia' },
        { id: 'ABA', label: 'ABA' },
        { id: 'OUTROS', label: 'Outros' },
    ];

    const toggleTerapia = (id: string) => {
        setFormData(prev => ({
            ...prev,
            terapias: prev.terapias.includes(id)
                ? prev.terapias.filter(t => t !== id)
                : [...prev.terapias, id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in text-gray-900">
            <form
                onSubmit={handleSubmit}
                className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-modal overflow-hidden animate-slide-in-up"
            >
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <User className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold">Novo Cliente (Paciente)</h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="label">Nome do Paciente *</label>
                            <input
                                required
                                value={formData.nomePaciente}
                                onChange={e => setFormData({ ...formData, nomePaciente: e.target.value })}
                                className="input"
                                placeholder="Nome completo da criança/paciente"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">Responsável (Opcional)</label>
                            <input
                                value={formData.nomeResponsavel}
                                onChange={e => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                                className="input"
                                placeholder="Nome do pai/mãe/tutor"
                            />
                        </div>
                        <div>
                            <label className="label">Telefone *</label>
                            <input
                                required
                                value={formData.telefone}
                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                className="input"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <label className="label">E-mail</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="input"
                                placeholder="contato@email.com"
                            />
                        </div>
                        <div>
                            <label className="label">Código CID</label>
                            <input
                                value={formData.cidCode}
                                onChange={e => setFormData({ ...formData, cidCode: e.target.value })}
                                className="input"
                                placeholder="Ex: F84.0"
                            />
                        </div>
                        <div>
                            <label className="label">Diagnóstico</label>
                            <input
                                value={formData.diagnostico}
                                onChange={e => setFormData({ ...formData, diagnostico: e.target.value })}
                                className="input"
                                placeholder="Ex: TEA"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="label text-[11px] font-bold uppercase text-text-muted">Terapias Recomendas/Iniciadas</label>
                        <div className="flex flex-wrap gap-2">
                            {terapiasDisponiveis.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => toggleTerapia(t.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${formData.terapias.includes(t.id)
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-primary/30'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {formData.terapias.includes('OUTROS') && (
                            <div className="mt-3">
                                <label className="label">Especifique as outras terapias</label>
                                <input
                                    value={formData.terapiasOutros}
                                    onChange={e => setFormData({ ...formData, terapiasOutros: e.target.value })}
                                    className="input"
                                    placeholder="Ex: Terapia de Casal, Acupuntura..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Tipo de Pagamento</label>
                            <select
                                value={formData.tipoPagamento}
                                onChange={e => setFormData({ ...formData, tipoPagamento: e.target.value })}
                                className="input"
                            >
                                <option value="PARTICULAR">Particular</option>
                                <option value="CONVENIO">Convênio</option>
                                <option value="MISTO">Misto</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Valor Pago por Mês (R$)</label>
                            <input
                                type="number"
                                value={formData.valorMensal}
                                onChange={e => setFormData({ ...formData, valorMensal: e.target.value })}
                                className="input"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {formData.tipoPagamento !== 'PARTICULAR' && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 animate-fade-in shadow-inner">
                            <div className="col-span-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Dados do Convênio</div>
                            <div>
                                <label className="label">Nome Convênio</label>
                                <input
                                    value={formData.convenioNome}
                                    onChange={e => setFormData({ ...formData, convenioNome: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Nº Carteirinha</label>
                                <input
                                    value={formData.convenioCarteira}
                                    onChange={e => setFormData({ ...formData, convenioCarteira: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="label">Validade Carteirinha</label>
                                <input
                                    type="date"
                                    value={formData.convenioValidade}
                                    onChange={e => setFormData({ ...formData, convenioValidade: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 flex gap-3">
                    <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-gray-500">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary flex-1 justify-center gap-2 shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4" />
                        Salvar Cliente
                    </button>
                </div>
            </form>
        </div>
    );
}
