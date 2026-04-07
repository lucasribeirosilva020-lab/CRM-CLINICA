'use client';

import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger',
    isLoading = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const themes = {
        danger: {
            icon: AlertTriangle,
            iconClass: 'bg-error/10 text-error',
            btnClass: 'bg-error hover:bg-error-400 text-white shadow-error/20',
            borderClass: 'border-error/20'
        },
        warning: {
            icon: AlertTriangle,
            iconClass: 'bg-warning/10 text-warning',
            btnClass: 'bg-warning hover:bg-warning-400 text-white shadow-warning/20',
            borderClass: 'border-warning/20'
        },
        info: {
            icon: Info,
            iconClass: 'bg-primary/10 text-primary',
            btnClass: 'bg-primary hover:bg-primary-400 text-white shadow-primary/20',
            borderClass: 'border-primary/20'
        },
        success: {
            icon: CheckCircle,
            iconClass: 'bg-success/10 text-success',
            btnClass: 'bg-success hover:bg-success-400 text-white shadow-success/20',
            borderClass: 'border-success/20'
        }
    };

    const theme = themes[variant];
    const Icon = theme.icon;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                onClick={!isLoading ? onClose : undefined}
            />
            
            {/* Modal */}
            <div className={cn(
                "relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 border",
                theme.borderClass
            )}>
                <div className="p-6">
                    <div className="flex flex-col items-center text-center">
                        <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300", theme.iconClass)}>
                            <Icon className="w-8 h-8" />
                        </div>
                        
                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 h-12 bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 h-12 font-black rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center",
                            theme.btnClass
                        )}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
