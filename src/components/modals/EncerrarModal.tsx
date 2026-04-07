'use client';

import { useState } from 'react';
import { X, Save, ShieldAlert, ArchiveX } from 'lucide-react';

interface EncerrarModalProps {
    onClose: () => void;
    onSave: (motivo: string) => void;
}

export default function EncerrarModal({ onClose, onSave }: EncerrarModalProps) {
    const [motivo, setMotivo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (motivo.trim().length < 5) {
            alert('Por favor, descreva o motivo com pelo menos 5 caracteres.');
            return;
        }
        onSave(motivo);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in text-gray-900">
            <form
                onSubmit={handleSubmit}
                className="bg-white w-full max-w-sm rounded-2xl border border-gray-200 shadow-modal overflow-hidden animate-slide-in-up"
            >
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-error/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center border border-error/20">
                            <ArchiveX className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-error md:text-gray-900">Encerrar Conversa</h2>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-xs text-text-muted">
                        Ao encerrar, o atendimento será movido automaticamente para a aba de <strong className="text-error">Leads Perdidos</strong>. 
                        Caso o cliente volte a enviar mensagens, ele retornará para a fila ativa.
                    </p>

                    <div>
                        <label className="label">Motivo do Encerramento *</label>
                        <textarea
                            required
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            className="input min-h-[100px] resize-none"
                            placeholder="Descreva por que a conversa está sendo encerrada (ex: Lead não respondeu, sem interesse, etc...)"
                        />
                    </div>
                </div>

                <div className="p-5 bg-gray-50 border-t border-gray-200 flex gap-3">
                    <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center text-gray-500">
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary bg-error hover:bg-error/90 border-error flex-1 justify-center gap-2 shadow-lg shadow-error/20 text-white">
                        <Save className="w-4 h-4" />
                        Confirmar
                    </button>
                </div>
            </form>
        </div>
    );
}
