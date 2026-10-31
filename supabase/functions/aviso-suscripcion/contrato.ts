export interface VigenciaSuColor {
    version: 1;
    producto: 'sucolor';
    fecha_inicio: string;
    fecha_fin: string;
    dias_aviso: 7;
    consultado_en: string;
}
export const VIGENCIA_MAXIMA_MS = 240_000;
function fechaValida(valor: unknown): valor is string {
    return (
        typeof valor === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(valor) &&
        Number.isFinite(Date.parse(valor)) &&
        new Date(valor).toISOString().slice(0, 10) === valor
    );
}
export function validarVigencia(valor: unknown, ahora = Date.now()): valor is VigenciaSuColor {
    if (!valor || typeof valor !== 'object') return false;
    const v = valor as VigenciaSuColor;
    const antiguedad = ahora - Date.parse(v.consultado_en);
    return (
        v.version === 1 &&
        v.producto === 'sucolor' &&
        v.dias_aviso === 7 &&
        fechaValida(v.fecha_inicio) &&
        fechaValida(v.fecha_fin) &&
        v.fecha_fin >= v.fecha_inicio &&
        Number.isFinite(antiguedad) &&
        antiguedad >= -30_000 &&
        antiguedad < VIGENCIA_MAXIMA_MS
    );
}
export function avisoVigencia(valor: unknown, ahora = Date.now()) {
    if (!validarVigencia(valor, ahora)) return null;
    const hoy = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(ahora));
    if (valor.fecha_inicio > hoy) return null;
    const dias = Math.round((Date.parse(valor.fecha_fin) - Date.parse(hoy)) / 86_400_000);
    if (dias > 7) return null;
    const fecha = new Intl.DateTimeFormat('es-EC', {
        timeZone: 'UTC',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(valor.fecha_fin));
    if (dias < 0)
        return {
            titulo: 'Tu suscripción está vencida',
            mensaje: `Tu suscripción a SuColor venció el ${fecha}. Comunícate con SIXELA para gestionar tu renovación.`,
            vencida: true,
        };
    return {
        titulo: dias === 0 ? 'Tu suscripción vence hoy' : 'Tu suscripción está por vencer',
        mensaje: `Tu suscripción a SuColor ${dias === 0 ? 'vence hoy' : `vence el ${fecha}`}. Realiza tu pago para gestionar la renovación. Si ya pagaste, comunícate con SIXELA.`,
        vencida: false,
    };
}
