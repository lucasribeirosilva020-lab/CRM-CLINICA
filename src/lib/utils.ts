import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTempo(date: Date | string | null): string {
    if (!date) return '--';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function formatDuracao(segundos: number): string {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}:${segs.toString().padStart(2, '0')}`;
}

export function formatData(date: Date | string, pattern = 'dd/MM/yyyy'): string {
    return format(new Date(date), pattern, { locale: ptBR });
}

export function formatDataHora(date: Date | string): string {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function minutosDesde(date: Date | string): number {
    return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
}

export function calcularIdade(dataNasc: Date | string): number {
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

export function formatarTelefone(tel: string): string {
    const nums = tel.replace(/\D/g, '');
    if (nums.length === 11) {
        return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
    } else if (nums.length === 10) {
        return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
    }
    return tel;
}

export function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(valor);
}

export function getAvatarUrl(nome: string, size = 40): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&size=${size}&background=1A73E8&color=fff&bold=true&format=svg`;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export const ESPECIALIDADES_MAP: Record<string, string> = {
    FONOAUDIOLOGIA: 'Fonoaudiologia',
    PSICOLOGIA: 'Psicologia',
    TERAPIA_OCUPACIONAL: 'Terapia Ocupacional',
    PSICOPEDAGOGIA: 'Psicopedagogia',
    NEUROPSICOLOGIA: 'Neuropsicologia',
    FISIOTERAPIA: 'Fisioterapia',
    ABA: 'ABA (Análise do Comportamento)',
    OUTRA: 'Outra',
};

export const CID_OPTIONS = [
    { value: 'F84.0', label: 'F84.0 — TEA (Autismo)' },
    { value: 'F90.0', label: 'F90.0 — TDAH' },
    { value: 'F81.0', label: 'F81.0 — Dislexia' },
    { value: 'F81.2', label: 'F81.2 — Discalculia' },
    { value: 'F80.0', label: 'F80.0 — Dislalia' },
    { value: 'F82', label: 'F82 — TDC (Motor)' },
    { value: 'F84.5', label: 'F84.5 — Síndrome de Asperger' },
    { value: 'OUTRO', label: 'Outro (especificar)' },
];
