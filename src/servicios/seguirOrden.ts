import axios, { AxiosError } from 'axios';
import type { SeguimientoOrdenResponse } from '@/tipos';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

if (!SUPABASE_URL) {
    console.warn(
        '[SuColor] VITE_SUPABASE_URL no está configurado. ' +
        'Crea un archivo .env con VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co'
    );
}

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/track-order`;

// ─── Typed API Error ───────────────────────────────────────────────────────────
export class SeguimientoOrdenError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'SeguimientoOrdenError';
        this.status = status;
    }
}

// ─── API Function ──────────────────────────────────────────────────────────────
export async function fetchSeguimientoOrden(
    codigo: string,
    token: string
): Promise<SeguimientoOrdenResponse> {
    try {
        const response = await axios.get<SeguimientoOrdenResponse>(EDGE_FUNCTION_URL, {
            params: { codigo, token },
            timeout: 15000,
        });

        if (!response.data?.ok) {
            throw new SeguimientoOrdenError(
                'No se encontró la orden. Verifica el código y el token.',
                404
            );
        }

        return response.data;
    } catch (err) {
        if (err instanceof SeguimientoOrdenError) throw err;

        const axiosErr = err as AxiosError<{ error?: string; message?: string }>;

        if (axiosErr.response) {
            const status = axiosErr.response.status;
            const serverMsg =
                axiosErr.response.data?.error ||
                axiosErr.response.data?.message;

            if (status === 404) {
                throw new SeguimientoOrdenError(
                    serverMsg || 'Orden no encontrada. Verifica el código.',
                    404
                );
            }
            if (status === 401 || status === 403) {
                throw new SeguimientoOrdenError(
                    serverMsg || 'Token inválido o sin permisos.',
                    status
                );
            }
            throw new SeguimientoOrdenError(
                serverMsg || 'Error del servidor. Intenta más tarde.',
                status
            );
        }

        if (axiosErr.code === 'ECONNABORTED') {
            throw new SeguimientoOrdenError(
                'La conexión tardó demasiado. Verifica tu internet.',
                408
            );
        }

        throw new SeguimientoOrdenError(
            'No se pudo conectar al servidor. Verifica tu internet.',
            0
        );
    }
}
