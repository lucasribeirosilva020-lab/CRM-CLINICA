'use client';

import Header from '@/components/layout/Header';
import {
    BookOpen, MessageSquare, Columns, Users,
    BarChart2, Shield, Zap
} from 'lucide-react';

export default function GuiaUsoPage() {
    return (
        <div className="flex flex-col h-full animate-fade-in pb-20 md:pb-0">
            <Header
                title="Guia de Uso"
                subtitle="Aprenda a utilizar o CRM Clínica de forma eficiente"
            />

            <div className="p-4 space-y-6 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
                <section className="card">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Zap className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Visão Geral</h2>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">
                        O CRM Clínica é um sistema integrado de gestão para clínicas de terapias.
                        Ele permite gerenciar o fluxo de atendimento desde o primeiro contato (Lead)
                        até o acompanhamento recorrente do paciente.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="card">
                        <div className="flex items-center gap-3 mb-4 text-blue-500">
                            <MessageSquare className="w-5 h-5" />
                            <h2 className="text-base font-bold">Conversas</h2>
                        </div>
                        <ul className="text-sm text-text-muted space-y-2">
                            <li>• Centralize todos os contatos do WhatsApp.</li>
                            <li>• Agende mensagens para datas futuras.</li>
                            <li>• Transfira atendimentos entre membros da equipe.</li>
                        </ul>
                    </section>

                    <section className="card">
                        <div className="flex items-center gap-3 mb-4 text-purple-500">
                            <Columns className="w-5 h-5" />
                            <h2 className="text-base font-bold">Kanban</h2>
                        </div>
                        <ul className="text-sm text-text-muted space-y-2">
                            <li>• Visualize o progresso dos leads por colunas.</li>
                            <li>• Arraste e solte para mudar o status do lead.</li>
                            <li>• Organize prioridades de vendas e atendimento.</li>
                        </ul>
                    </section>

                    <section className="card">
                        <div className="flex items-center gap-3 mb-4 text-green-500">
                            <BarChart2 className="w-5 h-5" />
                            <h2 className="text-base font-bold">Relatórios de SLA</h2>
                        </div>
                        <ul className="text-sm text-text-muted space-y-2">
                            <li>• Monitore o tempo de resposta da equipe.</li>
                            <li>• Identifique gargalos no atendimento inicial.</li>
                            <li>• Exporte métricas para análise estratégica.</li>
                        </ul>
                    </section>

                    <section className="card">
                        <div className="flex items-center gap-3 mb-4 text-orange-500">
                            <Shield className="w-5 h-5" />
                            <h2 className="text-base font-bold">Privacidade</h2>
                        </div>
                        <ul className="text-sm text-text-muted space-y-2">
                            <li>• Dados isolados por clínica (Multi-tenancy).</li>
                            <li>• Controle de acesso por perfil (Admin/Vendedor/Atendente).</li>
                            <li>• Banco de dados seguro e criptografado.</li>
                        </ul>
                    </section>
                </div>

                <section className="card bg-primary/5 border-primary/20">
                    <h3 className="font-bold text-primary mb-2">Dica de Produtividade</h3>
                    <p className="text-sm text-primary/80">
                        Utilize o campo de busca global e os filtros inteligentes para encontrar
                        pacientes e conversas rapidamente. A exportação em Excel permite que você
                        faça análises detalhadas fora do sistema.
                    </p>
                </section>
            </div>
        </div>
    );
}
