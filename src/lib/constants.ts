import type { OrderStatus } from '@/types';

// ─── Order Status Config ───────────────────────────────────────────────────────
export interface StatusConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    glowColor: string;
    dotColor: string;
    step: number; // 0‒4 for progress bar
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    RECIBIDO: {
        label: 'Recibido',
        color: '#60A5FA',
        bgColor: 'rgba(96, 165, 250, 0.12)',
        borderColor: 'rgba(96, 165, 250, 0.3)',
        glowColor: 'rgba(96, 165, 250, 0.2)',
        dotColor: '#60A5FA',
        step: 0,
    },
    LATONERIA: {
        label: 'Latonería',
        color: '#A78BFA',
        bgColor: 'rgba(167, 139, 250, 0.12)',
        borderColor: 'rgba(167, 139, 250, 0.3)',
        glowColor: 'rgba(167, 139, 250, 0.2)',
        dotColor: '#A78BFA',
        step: 1,
    },
    PREPARACION: {
        label: 'Preparación',
        color: '#60A5FA',
        bgColor: 'rgba(96, 165, 250, 0.12)',
        borderColor: 'rgba(96, 165, 250, 0.3)',
        glowColor: 'rgba(96, 165, 250, 0.2)',
        dotColor: '#60A5FA',
        step: 2,
    },
    PINTURA: {
        label: 'Pintura',
        color: '#FF6B1A',
        bgColor: 'rgba(255, 107, 26, 0.12)',
        borderColor: 'rgba(255, 107, 26, 0.3)',
        glowColor: 'rgba(255, 107, 26, 0.2)',
        dotColor: '#FF6B1A',
        step: 3,
    },
    SECADO: {
        label: 'Secado',
        color: '#FB923C',
        bgColor: 'rgba(251, 146, 60, 0.12)',
        borderColor: 'rgba(251, 146, 60, 0.3)',
        glowColor: 'rgba(251, 146, 60, 0.2)',
        dotColor: '#FB923C',
        step: 4,
    },
    PULIDO_DETALLES: {
        label: 'Pulido y Detalles',
        color: '#EC4899',
        bgColor: 'rgba(236, 72, 153, 0.12)',
        borderColor: 'rgba(236, 72, 153, 0.3)',
        glowColor: 'rgba(236, 72, 153, 0.2)',
        dotColor: '#EC4899',
        step: 5,
    },
    TERMINADO: {
        label: 'Terminado',
        color: '#34D399',
        bgColor: 'rgba(52, 211, 153, 0.12)',
        borderColor: 'rgba(52, 211, 153, 0.3)',
        glowColor: 'rgba(52, 211, 153, 0.2)',
        dotColor: '#34D399',
        step: 6,
    },
    ENTREGADO: {
        label: 'Entregado',
        color: '#9CA3AF',
        bgColor: 'rgba(156, 163, 175, 0.10)',
        borderColor: 'rgba(156, 163, 175, 0.25)',
        glowColor: 'rgba(156, 163, 175, 0.1)',
        dotColor: '#9CA3AF',
        step: 7,
    },
};

import { ClipboardList, Hammer, Layers, Paintbrush, Wind, Sparkles, CheckCircle2, Camera, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Progress Steps ────────────────────────────────────────────────────────────
export interface ProgressStep {
    key: OrderStatus;
    label: string;
    icon: LucideIcon;
}

export const PROGRESS_STEPS: ProgressStep[] = [
    { key: 'RECIBIDO', label: 'Recibido', icon: ClipboardList },
    { key: 'LATONERIA', label: 'Latonería', icon: Hammer },
    { key: 'PREPARACION', label: 'Preparación', icon: Layers },
    { key: 'PINTURA', label: 'Pintura', icon: Paintbrush },
    { key: 'SECADO', label: 'Secado', icon: Wind },
    { key: 'PULIDO_DETALLES', label: 'Pulido', icon: Sparkles },
    { key: 'TERMINADO', label: 'Terminado', icon: CheckCircle2 },
];

// ─── Media Categories ──────────────────────────────────────────────────────────
export const MEDIA_CATEGORIES = [
    { key: 'ANTES', label: 'Antes', icon: Camera },
    { key: 'PROCESO', label: 'Proceso', icon: Wrench },
    { key: 'DESPUES', label: 'Después', icon: Sparkles },
] as const;

// ─── Date Formatting ───────────────────────────────────────────────────────────
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
