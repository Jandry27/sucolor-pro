import type { BusquedaOrdenResponse } from '@/tipos';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/search-order`;

export class BusquedaOrdenError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'BusquedaOrdenError';
        this.status = status;
    }
}

export interface SearchParams {
    placa: string;
}

export async function buscarOrden(params: SearchParams): Promise<BusquedaOrdenResponse> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                placa: params.placa,
            }),
            signal: controller.signal,
        });

        let data: BusquedaOrdenResponse | null = null;

        try {
            data = (await response.json()) as BusquedaOrdenResponse;
        } catch {
            data = null;
        }

        if (!response.ok || !data?.ok) {
            throw new BusquedaOrdenError(
                data?.message || 'No se encontró una orden activa para esa placa.',
                response.status || 0
            );
        }

        return data;
    } catch (error) {
        if (error instanceof BusquedaOrdenError) {
            throw error;
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new BusquedaOrdenError('La conexión tardó demasiado.', 408);
        }

        throw new BusquedaOrdenError('No se pudo conectar al servidor.', 0);
    } finally {
        window.clearTimeout(timeout);
    }
}
