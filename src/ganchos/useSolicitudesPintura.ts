import { useEffect, useState } from 'react';
import { supabase } from '@/biblioteca/clienteSupabase';
import {
    consultarSolicitudesPintura,
    type FiltrosPintura,
    type ProveedorPintura,
    type SolicitudPintura,
} from '@/biblioteca/solicitudesPintura';

export function useSolicitudesPintura(filtros: FiltrosPintura, pagina: number) {
    const [revision, setRevision] = useState(0);
    const [datos, setDatos] = useState<{
        solicitudes: SolicitudPintura[];
        proveedores: ProveedorPintura[];
        total: number;
    }>({ solicitudes: [], proveedores: [], total: 0 });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        setCargando(true);
        setError('');
        Promise.all([
            consultarSolicitudesPintura(filtros, pagina, controller.signal),
            supabase
                .from('resumen_proveedores_pintura')
                .select('*')
                .order('nombre')
                .abortSignal(controller.signal),
        ])
            .then(([historial, resumen]) => {
                if (controller.signal.aborted) return;
                if (resumen.error) throw resumen.error;
                setDatos({ ...historial, proveedores: resumen.data ?? [] });
            })
            .catch(() => {
                if (!controller.signal.aborted)
                    setError('No se pudo cargar el control de pinturas. Vuelve a intentarlo.');
            })
            .finally(() => {
                if (!controller.signal.aborted) setCargando(false);
            });
        return () => controller.abort();
    }, [filtros, pagina, revision]);
    return { ...datos, cargando, error, recargar: () => setRevision(r => r + 1) };
}
