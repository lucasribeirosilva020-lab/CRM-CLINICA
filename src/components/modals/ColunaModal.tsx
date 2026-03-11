import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ColunaModalProps {
    isOpen: boolean;
    onClose: () => void;
    coluna?: { id: string; nome: string; cor: string } | null;
    tipo: 'ATENDIMENTO' | 'VENDAS';
    onSalvar: (nome: string, cor: string, id?: string) => Promise<boolean>;
}

const coresPermitidas = [
    '#E8EAED', // Cinza claro (padrão)
    '#E8F0FE', // Azul claro
    '#FEF7E0', // Amarelo claro
    '#FCE8E6', // Vermelho/Rosa claro
    '#E6F4EA', // Verde claro
    '#F3E8FD', // Roxo claro
    '#FDE293', // Amarelo
    '#A8DAB5', // Verde esmeralda
    '#F28B82', // Salmão/Vermelho
    '#8AB4F8', // Azul médio
    '#1A73E8', // Azul forte
    '#34A853', // Verde forte
    '#EA4335', // Vermelho forte
    '#FBBC04', // Amarelo forte
];

export default function ColunaModal({ isOpen, onClose, coluna, tipo, onSalvar }: ColunaModalProps) {
    const [nome, setNome] = useState('');
    const [cor, setCor] = useState(coresPermitidas[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (coluna) {
                setNome(coluna.nome);
                setCor(coluna.cor || coresPermitidas[0]);
            } else {
                setNome('');
                setCor(coresPermitidas[0]);
            }
        }
    }, [isOpen, coluna]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;
        setLoading(true);
        const success = await onSalvar(nome, cor, coluna?.id);
        setLoading(false);
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div
                className="bg-white rounded-2xl w-full max-w-sm shadow-xl flex flex-col animate-scale-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text">
                        {coluna ? 'Editar Coluna' : 'Nova Coluna'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-text-muted transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-1">
                            Nome da Coluna
                        </label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            placeholder="Ex: Em Análise"
                            className="input-field"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text-muted mb-2">
                            Cor de Destaque
                        </label>
                        <div className="grid grid-cols-7 gap-2">
                            {coresPermitidas.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCor(c)}
                                    className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ backgroundColor: c }}
                                >
                                    {cor === c && <Check className="w-4 h-4 text-black/60 mix-blend-difference" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <p className="text-[10px] text-text-muted pt-2 text-center">
                        Esta coluna ficará disponível no <strong>Kanban de {tipo === 'ATENDIMENTO' ? 'Atendimento' : 'Vendas'}</strong>.
                    </p>

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                            disabled={!nome.trim() || loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Coluna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
