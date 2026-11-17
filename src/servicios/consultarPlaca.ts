import { supabase } from '@/biblioteca/clienteSupabase';

type RespuestaPlaca = {
    marca?: string;
    modelo?: string;
    anio?: string;
    codigo?: string;
};

export async function consultarPlacaExterna(placa: string, signal: AbortSignal) {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) return { codigo: 'sin_sesion' };

    const ruta =
        import.meta.env.VITE_CONSULTA_PLACA_LOCAL === 'true'
            ? '/api/local/consulta-placa'
            : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/consulta-placa`;
    const consulta = new AbortController();
    const cancelar = () => consulta.abort();
    if (signal.aborted) cancelar();
    signal.addEventListener('abort', cancelar, { once: true });
    const espera = setTimeout(cancelar, 24000);

    try {
        const respuesta = await fetch(ruta, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ placa }),
            signal: consulta.signal,
        });
        const datos: RespuestaPlaca = await respuesta.json();
        if (!respuesta.ok) return { codigo: datos.codigo ?? 'proveedor_no_disponible' };
        const { marca, modelo, anio } = datos;
        return marca && modelo && anio ? { marca, modelo, anio } : { codigo: 'datos_incompletos' };
    } finally {
        clearTimeout(espera);
        signal.removeEventListener('abort', cancelar);
    }
}
