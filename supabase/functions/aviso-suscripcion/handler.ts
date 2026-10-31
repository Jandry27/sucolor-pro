import { validarVigencia } from './contrato.ts';
interface Dependencias {
    autorizar: (token: string) => Promise<'admin' | 'denegado' | 'sin_sesion'>;
    consultar: () => Promise<unknown>;
}
export function crearHandler({ autorizar, consultar }: Dependencias) {
    return async (req: Request): Promise<Response> => {
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Cache-Control': 'no-store',
        };
        const responder = (body: unknown, status = 200) => Response.json(body, { status, headers });
        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
        if (req.method !== 'POST') return responder({ error: 'Método no permitido' }, 405);
        const token = /^Bearer (\S+)$/.exec(req.headers.get('Authorization') ?? '')?.[1];
        if (!token) return responder({ error: 'Sesión requerida' }, 401);
        try {
            const permiso = await autorizar(token);
            if (permiso !== 'admin')
                return responder(
                    { error: 'Acceso denegado' },
                    permiso === 'sin_sesion' ? 401 : 403
                );
            const valor = await consultar();
            if (!validarVigencia(valor) || Date.now() - Date.parse(valor.consultado_en) > 30_000)
                throw new Error('Respuesta inválida');
            // Proyección explícita: nunca retransmitir otros campos del servidor comercial.
            return responder({
                version: valor.version,
                producto: valor.producto,
                fecha_inicio: valor.fecha_inicio,
                fecha_fin: valor.fecha_fin,
                dias_aviso: valor.dias_aviso,
                consultado_en: valor.consultado_en,
            });
        } catch {
            console.warn('SuColor: aviso de suscripción no disponible');
            return responder({ error: 'Consulta no disponible' }, 503);
        }
    };
}
