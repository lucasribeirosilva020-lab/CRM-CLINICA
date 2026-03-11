'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Clock, Calendar, Save, Loader2 } from 'lucide-react';

export default function ClinicaConfigPage() {
    const { usuario, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        slaMinutos: 60,
        diasInatividade: 30
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch('/api/configuracoes/clinica');
                const json = await res.json();
                if (json.success) {
                    setFormData({
                        nome: json.data.nome,
                        slaMinutos: json.data.configuracoes.slaMinutos,
                        diasInatividade: json.data.configuracoes.diasInatividade
                    });
                }
            } catch (error) {
                console.error('Erro ao buscar configurações:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/configuracoes/clinica', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                alert('Configurações atualizadas com sucesso!');
            } else {
                alert('Erro ao atualizar configurações: ' + json.error);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro de conexão ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-text-muted mt-2">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in pb-10">
            <Header
                title="Minha Clínica"
                subtitle="Gerencie os dados e regras da sua clínica"
            />

            <div className="p-4 max-w-3xl mx-auto w-full">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Dados Gerais */}
                    <div className="card space-y-4">
                        <h2 className="text-sm font-bold text-text flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" /> Dados Gerais
                        </h2>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-text-muted uppercase">Nome da Clínica</label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                disabled={!isAdmin}
                                className="input h-10"
                                placeholder="Nome da Clínica"
                                required
                            />
                            {!isAdmin && <p className="text-[10px] text-error">Apenas administradores podem alterar o nome.</p>}
                        </div>
                    </div>

                    {/* Regras de Atendimento */}
                    <div className="card space-y-4">
                        <h2 className="text-sm font-bold text-text flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Atendimento e SLA
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted uppercase">Tempo de SLA (Minutos)</label>
                                <input
                                    type="number"
                                    value={formData.slaMinutos}
                                    onChange={(e) => setFormData({ ...formData, slaMinutos: Number(e.target.value) })}
                                    className="input h-10"
                                    min="1"
                                    required
                                />
                                <p className="text-[10px] text-text-muted">Tempo máximo para resposta antes de alertar atraso.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-text-muted uppercase">Dias para Inatividade</label>
                                <input
                                    type="number"
                                    value={formData.diasInatividade}
                                    onChange={(e) => setFormData({ ...formData, diasInatividade: Number(e.target.value) })}
                                    className="input h-10"
                                    min="1"
                                    required
                                />
                                <p className="text-[10px] text-text-muted">Dias sem interação para arquivar conversa automaticamente.</p>
                            </div>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end gap-3 sticky bottom-4 z-10">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary px-6 h-11 flex items-center gap-2 shadow-lg"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
