'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Wifi, WifiOff, RefreshCw, Smartphone, AlertCircle, CheckCircle, Settings, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type WhatsAppStatus = 'disconnected' | 'loading' | 'qr_ready' | 'connected' | 'error';

export default function WhatsAppConfigPage() {
    const { isAdmin } = useAuth();
    const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
    const [qrBase64, setQrBase64] = useState<string>('');
    const [mensagem, setMensagem] = useState('Conecte seu número para receber e enviar mensagens.');
    const [erroDetalhe, setErroDetalhe] = useState<string>('');
    const [polling, setPolling] = useState(false);

    // Verifica status ao carregar
    useEffect(() => {
        const verificar = async () => {
            try {
                const res = await fetch('/api/whatsapp');
                const json = await res.json();
                if (json.success) {
                    const state = json.data?.instance?.state || json.data?.state;
                    if (state === 'open') {
                        setStatus('connected');
                        setMensagem('WhatsApp conectado e funcionando!');
                    }
                }
            } catch { }
        };
        verificar();
    }, []);

    // Polling para detectar quando QR foi escaneado
    const iniciarPolling = useCallback(() => {
        setPolling(true);
        let tentativas = 0;

        const interval = setInterval(async () => {
            tentativas++;
            try {
                const res = await fetch('/api/whatsapp');
                const json = await res.json();
                const state = json.data?.instance?.state || json.data?.state;

                if (state === 'open') {
                    setStatus('connected');
                    setMensagem('✅ WhatsApp conectado! Mensagens serão recebidas automaticamente.');
                    setQrBase64('');
                    setPolling(false);
                    clearInterval(interval);
                }
            } catch { }

            if (tentativas >= 30) { // 90 segundos
                clearInterval(interval);
                setPolling(false);
                setStatus('disconnected');
                setMensagem('QR Code expirou. Clique em Gerar QR Code para tentar novamente.');
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const gerarQRCode = async () => {
        if (!isAdmin) return;
        setStatus('loading');
        setMensagem('Conectando com a Evolution API...');
        setErroDetalhe('');
        setQrBase64('');

        try {
            const res = await fetch('/api/whatsapp', { method: 'POST' });
            const json = await res.json();

            console.log('Resposta /api/whatsapp:', json); // DEBUG

            if (!json.success) {
                setStatus('error');
                setMensagem('Erro ao conectar com a Evolution API.');
                setErroDetalhe(json.error || 'Erro desconhecido');
                return;
            }

            const qr = json.data?.qrBase64;

            if (qr) {
                // Garante que tem o prefixo data:image/
                const src = qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
                setQrBase64(src);
                setStatus('qr_ready');
                setMensagem('Escaneie o QR Code com seu WhatsApp. Expira em ~90s.');
                iniciarPolling();
            } else if (json.data?.raw?.instance?.state === 'open') {
                setStatus('connected');
                setMensagem('WhatsApp já estava conectado!');
            } else {
                setStatus('error');
                const rawInfo = JSON.stringify(json.data?.raw || {}).slice(0, 200);
                setMensagem('Resposta inesperada da Evolution API.');
                setErroDetalhe(`Resposta recebida: ${rawInfo}`);
            }
        } catch (error: any) {
            setStatus('error');
            setMensagem('Erro de conexão com a API.');
            setErroDetalhe(error.message);
        }
    };

    const desconectar = async () => {
        try {
            await fetch('/api/whatsapp', { method: 'DELETE' });
        } catch { }
        setStatus('disconnected');
        setQrBase64('');
        setMensagem('WhatsApp desconectado.');
        setErroDetalhe('');
    };

    return (
        <div className="animate-fade-in">
            <Header title="WhatsApp" subtitle="Configuração e conexão" />

            <div className="p-4 max-w-2xl mx-auto space-y-4">

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
                        <p className="text-sm font-bold text-text">
                            {status === 'connected' && '🟢 WhatsApp Conectado'}
                            {status === 'disconnected' && '🔴 WhatsApp Desconectado'}
                            {status === 'loading' && '🟡 Conectando...'}
                            {status === 'qr_ready' && '📱 Aguardando escaneamento'}
                            {status === 'error' && '❌ Erro na conexão'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">{mensagem}</p>
                        {erroDetalhe && (
                            <p className="text-[10px] text-error mt-1 font-mono break-all bg-error/5 rounded p-1">{erroDetalhe}</p>
                        )}
                    </div>
                    {status === 'connected' && (
                        <button onClick={desconectar} className="text-xs py-1.5 px-3 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors font-medium flex-shrink-0">
                            Desconectar
                        </button>
                    )}
                </div>

                {/* Área do QR Code */}
                {isAdmin && (
                    <div className="card">
                        <h2 className="text-sm font-bold text-text mb-1">Conectar via QR Code</h2>
                        <p className="text-xs text-text-muted mb-4">
                            WhatsApp → 3 pontos → Aparelhos conectados → Conectar aparelho → Escaneie o QR Code.
                        </p>

                        <div className="flex flex-col items-center gap-4">
                            {/* Placeholder inicial */}
                            {(status === 'disconnected' || status === 'error') && (
                                <div className="w-56 h-56 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-center">
                                    <Smartphone className="w-10 h-10 text-text-light" />
                                    <p className="text-xs text-text-muted px-4">Clique em "Gerar QR Code" para iniciar</p>
                                </div>
                            )}

                            {/* Carregando */}
                            {status === 'loading' && (
                                <div className="w-56 h-56 rounded-xl bg-secondary flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                    <p className="text-xs text-text-muted">Gerando QR Code...</p>
                                </div>
                            )}

                            {/* QR Code real */}
                            {status === 'qr_ready' && qrBase64 && (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-56 h-56 rounded-xl border-2 border-primary p-2 bg-white shadow-lg">
                                        <img src={qrBase64} alt="QR Code WhatsApp" className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-xs text-text-muted text-center">⏱️ Expira em ~90 segundos</p>
                                    {polling && (
                                        <p className="text-[10px] text-primary flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Aguardando escaneamento...
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Conectado */}
                            {status === 'connected' && (
                                <div className="flex flex-col items-center gap-2 py-4">
                                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCircle className="w-10 h-10 text-success" />
                                    </div>
                                    <p className="text-sm font-bold text-success">Conectado com sucesso!</p>
                                    <p className="text-xs text-text-muted text-center">
                                        Novas mensagens aparecerão na aba <strong>Conversas</strong>.
                                    </p>
                                </div>
                            )}

                            {/* Botão de ação */}
                            {status !== 'connected' && status !== 'loading' && (
                                <button onClick={gerarQRCode} className="btn-primary gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    {status === 'qr_ready' ? 'Novo QR Code' : 'Gerar QR Code'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {!isAdmin && (
                    <div className="card flex items-center gap-3 border-warning/30 bg-warning/5">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                        <p className="text-sm text-text">Apenas <strong>administradores</strong> podem conectar o WhatsApp.</p>
                    </div>
                )}

                {/* Info técnica */}
                <div className="card">
                    <h2 className="text-sm font-bold text-text mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" /> Sobre a integração
                    </h2>
                    <div className="space-y-2 text-xs text-text-muted">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                            <span>Powered by <strong>Evolution API</strong> no seu VPS</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                            <span>Mensagens recebidas criam leads automaticamente</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                            <span>Cada clínica tem sua própria instância isolada</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                            <span>Webhook em <code className="bg-gray-100 px-1 rounded">/api/webhook/whatsapp</code> (precisa URL pública para receber mensagens)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
