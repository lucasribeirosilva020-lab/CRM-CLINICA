'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Wifi, WifiOff, RefreshCw, Smartphone, AlertCircle, CheckCircle, Settings, Loader2, Link as LinkIcon, Copy, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

type WhatsAppStatus = 'disconnected' | 'loading' | 'qr_ready' | 'connected' | 'error';
type IntegrationMode = 'uazapi' | 'n8n';

export default function WhatsAppConfigPage() {
    const { isAdmin } = useAuth();
    const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
    const [mode, setMode] = useState<IntegrationMode>('uazapi');
    const [qrBase64, setQrBase64] = useState<string>('');
    const [mensagem, setMensagem] = useState('Conecte seu número para receber e enviar mensagens.');
    const [erroDetalhe, setErroDetalhe] = useState<string>('');
    const [polling, setPolling] = useState(false);
    
    const [n8nWebhookUrl, setN8nWebhookUrl] = useState('');
    const [crmWebhookUrl, setCrmWebhookUrl] = useState('');
    const [clinicSlug, setClinicSlug] = useState('');
    const [saving, setSaving] = useState(false);

    // Verifica status e config ao carregar
    useEffect(() => {
        const verificar = async () => {
            try {
                const res = await fetch('/api/whatsapp');
                const json = await res.json();
                if (json.success) {
                    const config = json.data?.config;
                    if (config) {
                        setMode(config.whatsappModo as IntegrationMode || 'uazapi');
                        setN8nWebhookUrl(config.webhookN8nUrl || '');
                        setClinicSlug(json.data?.instance?.name || config.clinica?.slug || '');
                    }

                    const state = json.data?.instance?.status || json.data?.status;
                    if (state === 'open' || state === 'connected') {
                        setStatus('connected');
                        setMensagem(config?.whatsappModo === 'n8n' ? 'Integrado via n8n' : 'WhatsApp conectado e funcionando!');
                    }
                }
                
                // Define URL do Webhook do CRM para exibição
                const host = window.location.origin;
                setCrmWebhookUrl(`${host}/api/webhook/whatsapp`);
            } catch { }
        };
        verificar();
    }, []);

    // Polling para detectar quando QR foi escaneado (apenas no modo uazapi)
    const iniciarPolling = useCallback(() => {
        if (mode !== 'uazapi') return;
        setPolling(true);
        let tentativas = 0;

        const interval = setInterval(async () => {
            tentativas++;
            try {
                const res = await fetch('/api/whatsapp');
                const json = await res.json();
                const state = json.data?.instance?.status || json.data?.status;

                if (state === 'open' || state === 'connected') {
                    setStatus('connected');
                    setMensagem('✅ WhatsApp conectado!');
                    setQrBase64('');
                    setPolling(false);
                    clearInterval(interval);
                }
            } catch { }

            if (tentativas >= 30) {
                clearInterval(interval);
                setPolling(false);
                setStatus('disconnected');
                setMensagem('QR Code expirou. Tente novamente.');
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [mode]);

    const gerarQRCode = async () => {
        if (!isAdmin) return;
        setStatus('loading');
        setMensagem('Conectando com a Uazapi...');
        setErroDetalhe('');
        setQrBase64('');

        try {
            const res = await fetch('/api/whatsapp', { method: 'POST' });
            const json = await res.json();

            if (!json.success) {
                setStatus('error');
                setMensagem('Erro ao conectar com a API.');
                setErroDetalhe(json.error || 'Erro desconhecido');
                return;
            }

            if (json.data?.status === 'connected') {
                setStatus('connected');
                setMensagem('WhatsApp já estava conectado!');
                return;
            }

            const qr = json.data?.qrBase64;
            if (qr) {
                const src = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
                setQrBase64(src);
                setStatus('qr_ready');
                setMensagem('Escaneie o QR Code com seu WhatsApp.');
                iniciarPolling();
            } else {
                setStatus('error');
                setMensagem('Resposta inesperada da API.');
                setErroDetalhe('Não foi possível obter o QR Code.');
            }
        } catch (error: any) {
            setStatus('error');
            setMensagem('Erro de conexão.');
            setErroDetalhe(error.message);
        }
    };

    const salvarConfigN8n = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/whatsapp', {
                method: 'PUT',
                body: JSON.stringify({
                    whatsappModo: 'n8n',
                    webhookN8nUrl: n8nWebhookUrl
                })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Configuração do n8n salva!');
                setMode('n8n');
            } else {
                toast.error('Erro ao salvar configuração.');
            }
        } catch (e) {
            toast.error('Erro de conexão.');
        } finally {
            setSaving(false);
        }
    };

    const alternarModo = async (novoModo: IntegrationMode) => {
        try {
            await fetch('/api/whatsapp', {
                method: 'PUT',
                body: JSON.stringify({ whatsappModo: novoModo })
            });
            setMode(novoModo);
            setStatus('disconnected');
            setMensagem(novoModo === 'n8n' ? 'Modo n8n ativado.' : 'Modo Uazapi direto ativado.');
        } catch {
            toast.error('Erro ao mudar modo.');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado!');
    };

    return (
        <div className="animate-fade-in">
            <Header title="WhatsApp" subtitle="Configuração e conexão" />

            <div className="p-4 max-w-2xl mx-auto space-y-4">

                {/* Seletor de Modo */}
                <div className="flex bg-secondary p-1 rounded-xl gap-1">
                    <button 
                        onClick={() => alternarModo('uazapi')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            mode === 'uazapi' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text"
                        )}
                    >
                        Conexão Direta (Uazapi)
                    </button>
                    <button 
                        onClick={() => alternarModo('n8n')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            mode === 'n8n' ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-text"
                        )}
                    >
                        Orquestração via n8n
                    </button>
                </div>

                {/* Status Banner */}
                <div className={cn(
                    'card flex items-center gap-4',
                    status === 'connected' ? 'border-success/30 bg-success/5' :
                        status === 'qr_ready' ? 'border-warning/30 bg-warning/5' :
                            status === 'loading' ? 'border-primary/30 bg-secondary' :
                                status === 'error' ? 'border-error/30 bg-error/5' :
                                    'border-border'
                )}>
                    <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        status === 'connected' ? 'bg-success/10' :
                            status === 'qr_ready' ? 'bg-warning/10' :
                                status === 'error' ? 'bg-error/10' :
                                    status === 'loading' ? 'bg-secondary' : 'bg-gray-100'
                    )}>
                        {status === 'connected' && <Wifi className="w-6 h-6 text-success" />}
                        {(status === 'disconnected') && <WifiOff className="w-6 h-6 text-error" />}
                        {status === 'loading' && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
                        {status === 'qr_ready' && <Smartphone className="w-6 h-6 text-warning" />}
                        {status === 'error' && <AlertCircle className="w-6 h-6 text-error" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text uppercase tracking-wider">
                            {status === 'connected' ? '🟢 Ativo' : '🔴 Inativo'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{mensagem}</p>
                    </div>
                    
                    {/* Botão de Toggle Manual (Útil para n8n) */}
                    {mode === 'n8n' && isAdmin && (
                        <button 
                            onClick={async () => {
                                const novoEstado = status !== 'connected';
                                setSaving(true);
                                try {
                                    const res = await fetch('/api/whatsapp', {
                                        method: 'PUT',
                                        body: JSON.stringify({ whatsappConectado: novoEstado })
                                    });
                                    if (res.ok) {
                                        setStatus(novoEstado ? 'connected' : 'disconnected');
                                        setMensagem(novoEstado ? '✅ Integração n8n ativa' : 'Integração n8n pausada');
                                        toast.success(novoEstado ? 'Integrado!' : 'Desconectado!');
                                    }
                                } catch {
                                    toast.error('Erro ao mudar status.');
                                } finally {
                                    setSaving(false);
                                }
                            }}
                            disabled={saving}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-1.5",
                                status === 'connected' ? "bg-error/10 text-error hover:bg-error/20" : "bg-success text-white hover:bg-success/90"
                            )}
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : status === 'connected' ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                            {status === 'connected' ? 'Desconectar' : 'Conectar'}
                        </button>
                    )}
                </div>


                {/* Área de Configuração n8n */}
                {mode === 'n8n' && isAdmin && (
                    <div className="card space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <LinkIcon className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-bold text-text">Configuração do Agente</h2>
                        </div>

                        <div className="space-y-4">
                            {/* n8n Webhook (Input) - O MAIS IMPORTANTE */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                                <label className="text-[10px] uppercase font-bold text-primary px-1 tracking-wider">Link do Agente (Sofia/n8n)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://servidor-n8n.../webhook-test/sofia"
                                    value={n8nWebhookUrl}
                                    onChange={(e) => setN8nWebhookUrl(e.target.value)}
                                    className="input-field w-full text-xs font-mono"
                                />
                                <p className="text-[10px] text-text-muted px-1 mt-1">
                                    Cole aqui o link do seu fluxo no n8n que contém o Agente de IA.
                                </p>
                            </div>

                            <button 
                                onClick={salvarConfigN8n}
                                disabled={saving}
                                className="btn-primary w-full gap-2 py-3"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar Configuração do Agente
                            </button>

                            <hr className="border-border opacity-50" />

                            {/* Informações para o n8n "Falar de Volta" com o CRM */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] uppercase font-bold text-text-muted px-1">Configuração de Retorno (CRM)</h3>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-text-muted px-1">URL de Recebimento no CRM (Cloudflare/Tunnel)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={crmWebhookUrl} 
                                            onChange={(e) => setCrmWebhookUrl(e.target.value)}
                                            className="input-field flex-1 text-[11px] bg-secondary/50 font-mono"
                                            placeholder="Cole aqui o seu link .trycloudflare.com"
                                        />
                                        <button onClick={() => copyToClipboard(crmWebhookUrl)} className="p-2 hover:bg-secondary rounded-lg transition-colors border border-border">
                                            <Copy className="w-3.5 h-3.5 text-text-muted" />
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-text-muted px-1 italic">
                                        Este é o link que o n8n deve chamar. Se estiver usando Túnel, certifique-se que começa com https://...
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* Área do QR Code (Modo Uazapi) */}
                {mode === 'uazapi' && isAdmin && (
                    <div className="card text-center space-y-4">
                        <h2 className="text-sm font-bold text-text">Conexão Direta</h2>
                        <div className="flex flex-col items-center gap-4">
                            {(status === 'disconnected' || status === 'error') && (
                                <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 bg-secondary/30">
                                    <Smartphone className="w-8 h-8 text-text-light" />
                                    <p className="text-[10px] text-text-muted px-4">Gerar QR Code para conectar</p>
                                </div>
                            )}

                            {status === 'loading' && (
                                <div className="w-48 h-48 rounded-2xl bg-secondary flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                            )}

                            {status === 'qr_ready' && qrBase64 && (
                                <div className="flex flex-col items-center gap-3 animate-zoom-in">
                                    <div className="w-48 h-48 rounded-2xl border-2 border-primary p-2 bg-white shadow-xl">
                                        <img src={qrBase64} alt="QR Code WhatsApp" className="w-full h-full object-contain" />
                                    </div>
                                    {polling && (
                                        <p className="text-[10px] text-primary flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Aguardando escaneamento...
                                        </p>
                                    )}
                                </div>
                            )}

                            {status === 'connected' && (
                                <div className="flex flex-col items-center gap-2 py-4">
                                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-success" />
                                    </div>
                                    <p className="text-sm font-bold text-success">Conectado!</p>
                                </div>
                            )}

                            {status !== 'connected' && status !== 'loading' && (
                                <button onClick={gerarQRCode} className="btn-primary gap-2 w-full max-w-[200px]">
                                    <RefreshCw className="w-4 h-4" />
                                    {status === 'qr_ready' ? 'Novo QR Code' : 'Gerar QR Code'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Info técnica */}
                <div className="card">
                    <h2 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" /> Como funciona
                    </h2>
                    <div className="space-y-3 text-xs text-text-muted bg-secondary/20 p-3 rounded-xl">
                        <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <p><strong>Modo n8n:</strong> O n8n gerencia o WhatsApp e apenas "avisa" o CRM sobre novas mensagens.</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <p><strong>Modo Uazapi:</strong> O CRM conecta diretamente ao serviço de WhatsApp.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

