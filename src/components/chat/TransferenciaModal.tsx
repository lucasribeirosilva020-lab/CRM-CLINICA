'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeftRight, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
    leadNome: string;
    onClose: () => void;
    onConfirm: (destino: string, destinoNome: string, resumo: string, orientacoes: string) => void;
}

export default function TransferenciaModal({ leadNome, onClose, onConfirm }: Props) {
    const [destino, setDestino] = useState('');
    const [resumo, setResumo] = useState('');
    const [orientacoes, setOrientacoes] = useState('');
    const [erro, setErro] = useState('');
    const [usuarios, setUsuarios] = useState<{id: string, nome: string, perfil: string}[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                const json = await res.json();
                if (json.success) {
                    setUsuarios(json.data);
                }
            } catch (err) {
                console.error('Erro ao carregar usuários:', err);
                setErro('Não foi possível carregar os usuários.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleConfirm = () => {
        if (!destino) { setErro('Selecione o destinatário'); return; }
        if (!resumo.trim()) { setErro('O resumo é obrigatório'); return; }
        const escolhido = usuarios.find(u => u.id === destino);
        onConfirm(destino, escolhido?.nome || 'Atendente', resumo, orientacoes);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
            <div className="bg-white rounded-2xl border border-border w-full max-w-md shadow-modal animate-slide-in-up">
                
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

                    <div>
                        <label className="label block text-sm font-medium mb-1">Transferir para *</label>
                        <select
                            value={destino}
                            onChange={(e) => { setDestino(e.target.value); setErro(''); }}
                            className="input w-full p-2 border rounded-md text-sm"
                            disabled={loading}
                        >
                            <option value="">{loading ? 'Carregando usuários...' : 'Selecione o destinatário...'}</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.nome} — {u.perfil}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label block text-sm font-medium mb-1">Resumo do que aconteceu *</label>
                        <textarea
                            value={resumo}
                            onChange={(e) => { setResumo(e.target.value); setErro(''); }}
                            placeholder="Descreva o que foi conversado..."
                            className="input w-full p-2 border rounded-md text-sm resize-none"
                            rows={4}
                        />
                        <p className="text-xs text-black/50 mt-1">{resumo.length}/500 caracteres</p>
                    </div>

                    <div>
                        <label className="label block text-sm font-medium mb-1">Orientações para o próximo <span className="opacity-50 font-normal">(opcional)</span></label>
                        <textarea
                            value={orientacoes}
                            onChange={(e) => setOrientacoes(e.target.value)}
                            placeholder="Informe o que o próximo atendente deve fazer..."
                            className="input w-full p-2 border rounded-md text-sm resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose} className="btn-ghost flex-1 justify-center py-2 border rounded-md font-medium hover:bg-gray-50">Cancelar</button>
                        <button onClick={handleConfirm} className="btn-primary flex-1 flex justify-center items-center gap-2 py-2 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700">
                            <ArrowLeftRight className="w-4 h-4" />
                            Confirmar Transferência
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
