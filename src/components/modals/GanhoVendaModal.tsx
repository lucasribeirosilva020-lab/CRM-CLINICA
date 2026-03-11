'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, TrendingUp } from 'lucide-react';
import { formatarMoeda } from '@/lib/utils';

interface GanhoVendaModalProps {
    leadNome: string;
    onClose: () => void;
    onConfirm: (valor: number, vendedorId: string, servico: string, origem: string, pagamento: string) => void;
}

export default function GanhoVendaModal({ leadNome, onClose, onConfirm }: GanhoVendaModalProps) {
    const [valor, setValor] = useState<string>('');
    const [vendedorId, setVendedorId] = useState<string>('0');
    const [servico, setServico] = useState<string>('');
    const [origem, setOrigem] = useState<string>('Google ADS');
    const [pagamento, setPagamento] = useState<string>('Cartão de Crédito');
    const [vendedores, setVendedores] = useState<{ nome: string, id: string }[]>([]);

    useEffect(() => {
        const localVendedores = localStorage.getItem('crm_vendedores');
        if (localVendedores) {
            const parsed = JSON.parse(localVendedores);
            setVendedores(parsed.map((v: any, i: number) => ({ nome: v.nome, id: String(i) })));
        } else {
            setVendedores([
                { nome: 'Carlos Vendedor', id: '0' },
                { nome: 'Admin Sistema', id: '1' }
            ]);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valorNum = parseFloat(valor.replace(/[^0-9.-]+/g, ""));
        if (isNaN(valorNum) || valorNum <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }
        onConfirm(valorNum, vendedorId, servico, origem, pagamento);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-success/5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-success" />
                        </div>
                        <h2 className="text-lg font-bold text-text">Dar Ganho na Venda</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-border">
                        <p className="text-xs text-text-muted mb-1">Lead</p>
                        <p className="text-sm font-semibold text-text">{leadNome}</p>
                    </div>

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
                                placeholder="2500.00"
                                className="input py-2 text-sm font-bold"
                                autoFocus
                                required
                            />
                        </div>
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                <User className="w-3 h-3 text-primary" /> Vendedor
                            </label>
                            <select
                                value={vendedorId}
                                onChange={(e) => setVendedorId(e.target.value)}
                                className="input py-2 text-sm"
                                required
                            >
                                {vendedores.map((v) => (
                                    <option key={v.id} value={v.id}>{v.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                            Tipo de Serviço Contratado
                        </label>
                        <input
                            type="text"
                            value={servico}
                            onChange={(e) => setServico(e.target.value)}
                            placeholder="Ex: Fonoaudiologia, TDAH, etc."
                            className="input py-2 text-sm"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                Origem do Lead
                            </label>
                            <select
                                value={origem}
                                onChange={(e) => setOrigem(e.target.value)}
                                className="input py-2 text-sm"
                                required
                            >
                                <option value="Indicação">Indicação</option>
                                <option value="Google ADS">Google ADS</option>
                                <option value="Facebook ADS">Facebook ADS</option>
                                <option value="Instagram">Instagram</option>
                            </select>
                        </div>
                        <div>
                            <label className="label text-[10px] uppercase tracking-wider font-bold text-text-muted mb-1 flex items-center gap-2">
                                Forma de Pagamento
                            </label>
                            <select
                                value={pagamento}
                                onChange={(e) => setPagamento(e.target.value)}
                                className="input py-2 text-sm"
                                required
                            >
                                <option value="Pix">Pix</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                                <option value="Boleto">Boleto</option>
                                <option value="Dinheiro">Dinheiro</option>
                                <option value="Convênio">Convênio</option>
                            </select>
                        </div>
                    </div>

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
                            className="btn-primary flex-1 justify-center py-2 text-sm bg-success hover:bg-success-600 border-none shadow-lg shadow-success/20"
                        >
                            Confirmar Ganho
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
