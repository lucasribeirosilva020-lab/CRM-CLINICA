'use client';

import { useState } from 'react';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    leadNome: string;
    onClose: () => void;
    onConfirm: (destino: string, resumo: string, orientacoes: string) => void;
}

const USUARIOS_MOCK = [
    { id: 'u1', nome: 'Carlos Vendedor', perfil: 'VENDEDOR' },
    { id: 'u2', nome: 'Ana Atendente', perfil: 'ATENDENTE' },
    { id: 'u3', nome: 'Admin Sistema', perfil: 'ADMIN' },
];

export default function TransferenciaModal({ leadNome, onClose, onConfirm }: Props) {
    const [destino, setDestino] = useState('');
    const [resumo, setResumo] = useState('');
    const [orientacoes, setOrientacoes] = useState('');
    const [erro, setErro] = useState('');

    const handleConfirm = () => {
        if (!destino) { setErro('Selecione o destinatário'); return; }
        if (!resumo.trim()) { setErro('O resumo é obrigatório'); return; }
        onConfirm(destino, resumo, orientacoes);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
            <div className="bg-white rounded-2xl border border-border w-full max-w-md shadow-modal animate-slide-in-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                            <ArrowLeftRight className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text">Transferir Conversa</h2>
                            <p className="text-xs text-text-muted">{leadNome}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-text-muted">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {erro && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-error/10 border border-error/20">
                            <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                            <p className="text-sm text-error">{erro}</p>
                        </div>
                    )}

                    {/* Destinatário */}
                    <div>
                        <label className="label">Transferir para *</label>
                        <select
                            value={destino}
                            onChange={(e) => { setDestino(e.target.value); setErro(''); }}
                            className="input text-sm"
                        >
                            <option value="">Selecione o destinatário...</option>
                            {USUARIOS_MOCK.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nome} — {u.perfil}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Resumo obrigatório */}
                    <div>
                        <label className="label">Resumo do que aconteceu *</label>
                        <textarea
                            value={resumo}
                            onChange={(e) => { setResumo(e.target.value); setErro(''); }}
                            placeholder="Descreva o que foi conversado, diagnóstico do paciente, necessidades identificadas..."
                            className="input text-sm resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-text-muted mt-1">{resumo.length}/500 caracteres</p>
                    </div>

                    {/* Orientações opcionais */}
                    <div>
                        <label className="label">Orientações para o próximo <span className="text-text-muted normal-case font-normal">(opcional)</span></label>
                        <textarea
                            value={orientacoes}
                            onChange={(e) => setOrientacoes(e.target.value)}
                            placeholder="Informe o que o próximo atendente deve fazer ou verificar..."
                            className="input text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Ações */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancelar</button>
                        <button onClick={handleConfirm} className="btn-primary flex-1 justify-center">
                            <ArrowLeftRight className="w-4 h-4" />
                            Confirmar Transferência
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
