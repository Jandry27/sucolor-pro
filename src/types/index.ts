// ─── Order Status Types ─── (matches DB enum public.orden_estado) ────────────
export type OrderStatus =
    | 'RECIBIDO'
    | 'LATONERIA'
    | 'PREPARACION'
    | 'PINTURA'
    | 'SECADO'
    | 'PULIDO_DETALLES'
    | 'TERMINADO'
    | 'ENTREGADO';

export type MediaTipo = 'FOTO' | 'VIDEO';
export type MediaCategoria = 'ANTES' | 'PROCESO' | 'DESPUES';
export type Prioridad = 'NORMAL' | 'URGENTE';

// ─── API Response Types ────────────────────────────────────────────────────────
export interface Vehiculo {
    anio: number;
    color: string;
    marca: string;
    placa: string;
    modelo: string;
}

export interface Order {
    codigo: string;
    estado: OrderStatus;
    prioridad: Prioridad;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    notas_publicas: string | null;
    cliente: string;
    vehiculo: Vehiculo;
}

export interface TimelineEvent {
    id: string;
    tipo: string;
    descripcion: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

export interface MediaItem {
    id?: string;
    tipo: MediaTipo;
    categoria: MediaCategoria;
    signed_url: string;
    descripcion?: string;
    created_at?: string;
}

export interface TrackOrderResponse {
    ok: boolean;
    order: Order;
    timeline: TimelineEvent[];
    media: MediaItem[];
}

// ─── Hook State ───────────────────────────────────────────────────────────────
export interface TrackOrderState {
    data: TrackOrderResponse | null;
    loading: boolean;
    error: string | null;
}

// ─── Search Order ─────────────────────────────────────────────────────────────
export interface SearchOrderResponse {
    ok: boolean;
    codigo?: string;
    token?: string;
    message?: string;
}

export interface SearchOrderState {
    result: SearchOrderResponse | null;
    loading: boolean;
    error: string | null;
}

// ─── Admin Types ───────────────────────────────────────────────────────────────
export interface Cliente {
    id: string;
    nombres: string;        // Full name in one field (per real DB schema)
    telefono?: string;
    email?: string;
    cedula?: string;
    notas?: string;
    created_at: string;
}

export interface AdminOrder {
    id: string;
    codigo: string;
    estado: OrderStatus;
    prioridad: Prioridad;
    fecha_ingreso: string;
    fecha_estimada: string | null;
    notas_publicas: string | null;
    notas_internas: string | null;
    share_enabled: boolean;
    share_token: string | null;
    precio_total: number | null;
    monto_pagado: number | null;
    updated_at: string;
    cliente_id: string;
    vehiculo_id: string;
    cliente: Cliente;
    vehiculo: Vehiculo;
}

export interface AuthState {
    user: { id: string; email?: string } | null;
    loading: boolean;
    error: string | null;
}
