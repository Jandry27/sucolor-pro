import axios, { AxiosError } from 'axios';
import type { SearchOrderResponse } from '@/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/search-order`;

export class SearchOrderError extends Error {
    public status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'SearchOrderError';
        this.status = status;
    }
}

interface SearchByPlaca {
    placa: string;
    nombre?: never;
    apellido?: never;
}

interface SearchByNombre {
    nombre: string;
    apellido: string;
    placa?: never;
}

export type SearchParams = SearchByPlaca | SearchByNombre;

export async function searchOrder(params: SearchParams): Promise<SearchOrderResponse> {
    try {
        const response = await axios.get<SearchOrderResponse>(EDGE_FUNCTION_URL, {
            params,
            timeout: 15000,
        });

        if (!response.data?.ok) {
            throw new SearchOrderError(
                response.data?.message || 'No se encontró una orden activa.',
                404
            );
        }

        return response.data;
    } catch (err) {
        if (err instanceof SearchOrderError) throw err;

        const axiosErr = err as AxiosError<{ error?: string; message?: string }>;

        if (axiosErr.response) {
            const status = axiosErr.response.status;
            const msg =
                axiosErr.response.data?.error ||
                axiosErr.response.data?.message;
            throw new SearchOrderError(msg || 'No se encontró ninguna orden.', status);
        }

        if (axiosErr.code === 'ECONNABORTED') {
            throw new SearchOrderError('La conexión tardó demasiado.', 408);
        }

        throw new SearchOrderError('No se pudo conectar al servidor.', 0);
    }
}
