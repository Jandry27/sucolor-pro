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

export interface LineaTiempoEvent {
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

export interface SeguimientoOrdenResponse {
    ok: boolean;
    order: Order;
    gastos: OrdenGasto[];
    media: MediaItem[];
}

// ─── Hook State ───────────────────────────────────────────────────────────────
export interface SeguimientoOrdenState {
    data: SeguimientoOrdenResponse | null;
    loading: boolean;
    error: string | null;
}

// ─── Search Order ─────────────────────────────────────────────────────────────
export interface BusquedaOrdenResponse {
    ok: boolean;
    codigo?: string;
    token?: string;
    message?: string;
}

export interface BusquedaOrdenState {
    result: BusquedaOrdenResponse | null;
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
    direccion?: string;
    tipo_identificacion?: string;
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

export interface OrdenGasto {
    id: string;
    orden_id: string;
    descripcion: string;
    monto: number;
    factura_url: string | null;
    created_at: string;
}

// ─── SRI Electronic Invoicing ──────────────────────────────────────────────────
export interface CompanySettings {
    id: string;
    ruc: string;
    razon_social: string;
    nombre_comercial: string | null;
    direccion_matriz: string;
    obligado_contabilidad: boolean;
    contribuyente_especial: string | null;
    rimpe: boolean;
    agente_retencion: string | null;
    p12_storage_path: string | null;
    p12_password?: string | null;
    establecimiento: string;
    punto_emision: string;
    secuencial_factura: string;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    orden_id: string;
    secuencial: string | null;
    clave_acceso: string | null;
    estado: 'CREADA' | 'FIRMADA' | 'RECIBIDA' | 'AUTORIZADA' | 'RECHAZADA';
    ambiente: number;
    fecha_emision: string;
    subtotal_15: number;
    subtotal_0: number;
    subtotal_no_objeto: number;
    subtotal_exento: number;
    total_descuento: number;
    valor_iva: number;
    importe_total: number;
    xml_generado: string | null;
    autorizacion_fecha: string | null;
    mensajes_sri: any | null;
    created_at: string;
    updated_at: string;
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    codigo_principal: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    precio_total_sin_impuestos: number;
    codigo_porcentaje_iva: number; // 0 = 0%, 2 = 12%, 3 = 14%, 4 = 15%
    tarifa_iva: number;   
    valor_iva: number;
    created_at: string;
}
