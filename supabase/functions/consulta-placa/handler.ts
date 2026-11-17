type Configuracion = {
    supabaseUrl: string;
    supabaseAnonKey: string;
    hexasoftApiKeys: string[];
};

type DatosVehiculo = { marca: string; modelo: string; anio: string };

class ErrorConsulta extends Error {
    constructor(
        readonly codigo: string,
        readonly estado: number
    ) {
        super(codigo);
    }
}

async function consultarHexasoft(
    placa: string,
    clave: string,
    peticion: typeof fetch,
    signal: AbortSignal
): Promise<DatosVehiculo> {
    const url = new URL('https://demosridr.hexasoft-dev-ec.com/api/placa.php');
    url.searchParams.set('placa', placa);
    const respuesta = await peticion(url, {
        headers: { 'X-Api-Key': clave, Accept: 'application/json' },
        redirect: 'error',
        signal,
    });
    if (respuesta.status === 404) throw new ErrorConsulta('sin_resultado', 404);
    if (respuesta.status === 429) throw new ErrorConsulta('cupo_agotado', 429);
    if (!respuesta.ok) throw new ErrorConsulta('proveedor_no_disponible', 502);

    const cuerpo = await respuesta.json();
    const vehiculo = cuerpo?.datos?.vehiculo;
    const placaDevuelta = vehiculo?.numeroPlaca ?? cuerpo?.datos?.placa;
    const marca =
        typeof vehiculo?.descripcionMarca === 'string' ? vehiculo.descripcionMarca.trim() : '';
    const modelo =
        typeof vehiculo?.descripcionModelo === 'string' ? vehiculo.descripcionModelo.trim() : '';
    const anio = String(vehiculo?.anioAuto ?? '');
    if (
        cuerpo?.ok !== true ||
        typeof placaDevuelta !== 'string' ||
        placaDevuelta.replace(/[\s-]/g, '').toUpperCase() !== placa ||
        !marca ||
        !modelo ||
        !/^\d{4}$/.test(anio)
    ) {
        throw new ErrorConsulta('datos_incompletos', 502);
    }
    return { marca, modelo, anio };
}

export function crearConsultaPlaca(config: Configuracion, peticion = fetch) {
    const claves = [...new Set(config.hexasoftApiKeys.map(clave => clave.trim()).filter(Boolean))];
    const cuposAgotados = new Map<string, number>();

    async function consultarConCupo(placa: string): Promise<DatosVehiculo> {
        const signal = AbortSignal.timeout(12000);

        for (const clave of claves) {
            if ((cuposAgotados.get(clave) ?? 0) > Date.now()) continue;
            try {
                return await consultarHexasoft(placa, clave, peticion, signal);
            } catch (error) {
                if (!(error instanceof ErrorConsulta) || error.codigo !== 'cupo_agotado') {
                    throw error;
                }
                // Tras un 429, evita volver a consultar esa clave en cada búsqueda.
                cuposAgotados.set(clave, Date.now() + 60_000);
            }
        }
        throw new ErrorConsulta('cupo_agotado', 429);
    }

    const consultas = new Map<string, { vence: number; resultado: Promise<DatosVehiculo> }>();
    const cabeceras = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Cache-Control': 'no-store',
    };

    return async (req: Request) => {
        const responder = (datos: object, estado: number) =>
            Response.json(datos, { status: estado, headers: cabeceras });
        if (req.method === 'OPTIONS')
            return new Response(null, { status: 204, headers: cabeceras });
        if (req.method !== 'POST') return responder({ codigo: 'metodo_invalido' }, 405);

        const authorization = req.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) {
            return responder({ codigo: 'sin_sesion' }, 401);
        }
        try {
            const headers = { authorization, apikey: config.supabaseAnonKey };
            const usuario = await peticion(`${config.supabaseUrl}/auth/v1/user`, {
                headers,
                signal: AbortSignal.timeout(5000),
            });
            if (!usuario.ok) return responder({ codigo: 'sin_sesion' }, 401);
            const permiso = await peticion(`${config.supabaseUrl}/rest/v1/rpc/is_admin`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: '{}',
                signal: AbortSignal.timeout(5000),
            });
            if (!permiso.ok || (await permiso.json()) !== true) {
                return responder({ codigo: 'denegado' }, 403);
            }

            const cuerpo = await req.json().catch(() => null);
            const placa =
                typeof cuerpo?.placa === 'string'
                    ? cuerpo.placa.replace(/[\s-]/g, '').toUpperCase()
                    : '';
            if (!/^[A-Z0-9]{2,10}$/.test(placa))
                return responder({ codigo: 'placa_invalida' }, 400);
            if (!claves.length) return responder({ codigo: 'sin_configurar' }, 503);

            const ahora = Date.now();
            for (const [numero, consulta] of consultas) {
                if (consulta.vence <= ahora) consultas.delete(numero);
            }
            let consulta = consultas.get(placa);
            if (!consulta) {
                const resultado = consultarConCupo(placa);
                consulta = { resultado, vence: ahora + 10 * 60 * 1000 };
                consultas.set(placa, consulta);
                void resultado.catch(() => consultas.delete(placa));
            }
            return responder(await consulta.resultado, 200);
        } catch (error) {
            if (error instanceof ErrorConsulta)
                return responder({ codigo: error.codigo }, error.estado);
            return responder({ codigo: 'proveedor_no_disponible' }, 502);
        }
    };
}
