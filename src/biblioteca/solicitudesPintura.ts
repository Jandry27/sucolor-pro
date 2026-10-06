import { supabase } from '@/biblioteca/clienteSupabase';

export interface ProveedorPintura {
    id: string;
    nombre: string;
    solicitudes: number;
    muestras_pendientes: number;
    solicitudes_pendientes: number;
    valores_pendientes: number;
    valor_conocido: number;
}
export interface DatosSolicitudPintura {
    placa: string;
    color: string;
    codigo_color: string;
    proveedor_id: string;
    fecha_solicitud: string;
    valor: number | null;
    muestras_dejadas: number;
    muestras_retiradas: number;
    observaciones: string;
}
export interface SolicitudPintura extends DatosSolicitudPintura {
    id: string;
    version: number;
    muestras_pendientes: number;
    updated_at: string;
}
export interface FiltrosPintura {
    busqueda: string;
    proveedor: string;
    estado: string;
    desde: string;
    hasta: string;
}
export const TAMANO_PAGINA_PINTURAS = 25;
export function fechaHoyEcuador() {
    const partes = new Intl.DateTimeFormat('en', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const parte = (tipo: string) => partes.find(p => p.type === tipo)?.value;
    return `${parte('year')}-${parte('month')}-${parte('day')}`;
}
export function estadoMuestras(
    p: Pick<DatosSolicitudPintura, 'muestras_dejadas' | 'muestras_retiradas'>
) {
    if (!p.muestras_dejadas) return 'Sin muestra';
    if (p.muestras_retiradas === p.muestras_dejadas) return 'Retiradas';
    return p.muestras_retiradas ? 'Retiro parcial' : 'Pendientes';
}
export function validarSolicitudPintura(datos: DatosSolicitudPintura): DatosSolicitudPintura {
    const placa = datos.placa.trim().toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9-]{3,20}$/.test(placa))
        throw new Error('Ingresa una placa válida de 3 a 20 caracteres.');
    if (!datos.color.trim() || datos.color.trim().length > 300)
        throw new Error('Describe el color (máximo 300 caracteres).');
    if (!datos.proveedor_id) throw new Error('Selecciona el proveedor.');
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(datos.fecha_solicitud) ||
        Number.isNaN(Date.parse(datos.fecha_solicitud)) ||
        new Date(datos.fecha_solicitud).toISOString().slice(0, 10) !== datos.fecha_solicitud
    )
        throw new Error('Indica una fecha válida.');
    if (
        datos.valor !== null &&
        (!Number.isFinite(datos.valor) ||
            datos.valor < 0 ||
            datos.valor > 9999999999.99 ||
            Math.abs(datos.valor * 100 - Math.round(datos.valor * 100)) > 0.0001)
    )
        throw new Error('El valor debe ser positivo o cero y tener hasta dos decimales.');
    if (
        !Number.isInteger(datos.muestras_dejadas) ||
        datos.muestras_dejadas < 0 ||
        datos.muestras_dejadas > 1000 ||
        !Number.isInteger(datos.muestras_retiradas) ||
        datos.muestras_retiradas < 0 ||
        datos.muestras_retiradas > datos.muestras_dejadas
    )
        throw new Error(
            'Las cantidades deben ser enteras. No puedes retirar más muestras de las que dejaste.'
        );
    if (datos.observaciones.length > 2000 || datos.codigo_color.length > 80)
        throw new Error('Revisa la longitud del código y las observaciones.');
    return {
        proveedor_id: datos.proveedor_id,
        fecha_solicitud: datos.fecha_solicitud,
        valor: datos.valor,
        muestras_dejadas: datos.muestras_dejadas,
        muestras_retiradas: datos.muestras_retiradas,
        placa,
        color: datos.color.trim(),
        codigo_color: datos.codigo_color.trim(),
        observaciones: datos.observaciones.trim(),
    };
}
export async function consultarSolicitudesPintura(
    filtros: FiltrosPintura,
    pagina: number,
    signal: AbortSignal
) {
    let query = supabase.from('solicitudes_pintura').select('*', { count: 'exact' });
    // Excluye operadores de PostgREST y comodines escritos por el usuario.
    const termino = filtros.busqueda
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        .trim()
        .slice(0, 80);
    if (termino)
        query = query.or(
            `placa.ilike.%${termino}%,color.ilike.%${termino}%,codigo_color.ilike.%${termino}%`
        );
    if (filtros.proveedor) query = query.eq('proveedor_id', filtros.proveedor);
    if (filtros.estado === 'pendientes') query = query.gt('muestras_pendientes', 0);
    if (filtros.estado === 'retiradas')
        query = query.gt('muestras_dejadas', 0).eq('muestras_pendientes', 0);
    if (filtros.estado === 'sin_muestra') query = query.eq('muestras_dejadas', 0);
    if (filtros.estado === 'sin_valor') query = query.is('valor', null);
    if (filtros.desde) query = query.gte('fecha_solicitud', filtros.desde);
    if (filtros.hasta) query = query.lte('fecha_solicitud', filtros.hasta);
    const result = await query
        .order('fecha_solicitud', { ascending: false })
        .order('id')
        .range(pagina * TAMANO_PAGINA_PINTURAS, (pagina + 1) * TAMANO_PAGINA_PINTURAS - 1)
        .abortSignal(signal);
    if (result.error) throw result.error;
    return { solicitudes: (result.data ?? []) as SolicitudPintura[], total: result.count ?? 0 };
}
export async function guardarSolicitudPintura(
    id: string,
    datos: DatosSolicitudPintura,
    version?: number
) {
    const payload = validarSolicitudPintura(datos);
    // Un ID estable permite reintentar sin duplicar una solicitud ante cortes de red.
    const resultado =
        version === undefined
            ? await supabase
                  .from('solicitudes_pintura')
                  .upsert({ id, ...payload }, { onConflict: 'id', ignoreDuplicates: true })
                  .select('id')
            : await supabase
                  .from('solicitudes_pintura')
                  .update(payload)
                  .eq('id', id)
                  .eq('version', version)
                  .select('id');
    if (resultado.error) throw resultado.error;
    if (version === undefined && !resultado.data?.length) {
        const existente = await supabase
            .from('solicitudes_pintura')
            .select('*')
            .eq('id', id)
            .single();
        if (existente.error) throw existente.error;
        const coincide = (Object.keys(payload) as (keyof DatosSolicitudPintura)[]).every(
            clave => existente.data[clave] === payload[clave]
        );
        if (!coincide)
            throw new Error(
                'Este pedido ya se guardó en un intento anterior. Cierra el formulario y edítalo desde el historial.'
            );
    }
    if (version !== undefined && !resultado.data?.length)
        throw new Error(
            'Esta solicitud cambió en otra sesión. Cierra el formulario y recarga antes de editarla.'
        );
}
