import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSeguimientoOrden, SeguimientoOrdenError } from '@/servicios/seguirOrden';
import type { SeguimientoOrdenState } from '@/tipos';

interface UseSeguimientoOrdenOptions {
    codigo: string;
    token: string;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getCached(key: string): SeguimientoOrdenState['data'] | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw) as {
            data: SeguimientoOrdenState['data'];
            timestamp: number;
        };
        if (Date.now() - timestamp > CACHE_TTL_MS) {
            sessionStorage.removeItem(key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function setCached(key: string, data: SeguimientoOrdenState['data']): void {
    try {
        sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {
        // sessionStorage puede estar lleno o deshabilitado, no es crítico
    }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSeguimientoOrden({ codigo, token }: UseSeguimientoOrdenOptions): SeguimientoOrdenState & {
    refetch: () => void;
} {
    // Stable cache key stored in a ref
    const cacheKeyRef = useRef(`track:${codigo}:${token}`);
    const cacheKey = cacheKeyRef.current;

    // Initialize from cache if available — avoids showing loading on repeat visits
    const [state, setState] = useState<SeguimientoOrdenState>(() => {
        const cached = getCached(cacheKey);
        if (cached) return { data: cached, loading: false, error: null };
        return { data: null, loading: true, error: null };
    });

    const fetchData = useCallback(async () => {
        // Guard: both params required
        if (!codigo || !token) {
            setState({
                data: null,
                loading: false,
                error: 'Faltan parámetros. Verifica el enlace de seguimiento.',
            });
            return;
        }

        // Serve from cache when available
        const cached = getCached(cacheKey);
        if (cached) {
            setState({ data: cached, loading: false, error: null });
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await fetchSeguimientoOrden(codigo, token);
            setCached(cacheKey, data);
            setState({ data, loading: false, error: null });
        } catch (err) {
            const message =
                err instanceof SeguimientoOrdenError ? err.message : 'Ha ocurrido un error inesperado.';
            setState({ data: null, loading: false, error: message });
        }
    }, [codigo, token, cacheKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manual refetch: invalidate cache first so fresh data is always fetched
    const refetch = useCallback(() => {
        try {
            sessionStorage.removeItem(cacheKey);
        } catch {
            /* ignore */
        }
        fetchData();
    }, [fetchData, cacheKey]);

    return { ...state, refetch };
}
