import { describe, expect, it } from 'vitest';
import { crearConsultaPlaca } from '../../supabase/functions/consulta-placa/handler';

function prepararConsulta(estados: Record<string, number>) {
    const llamadas: string[] = [];
    const servidor = crearConsultaPlaca(
        {
            supabaseUrl: 'https://sucolor.example',
            supabaseAnonKey: 'clave-publica-de-pruebas',
            hexasoftApiKeys: ['original', 'respaldo-1', 'respaldo-2'],
        },
        async (input, init) => {
            const url = new URL(String(input));
            if (url.hostname === 'sucolor.example') return Response.json(true);
            const clave = new Headers(init?.headers).get('X-Api-Key') ?? '';
            llamadas.push(clave);
            const status = estados[clave];
            return Response.json(
                {
                    ok: status === 200,
                    datos: {
                        placa: url.searchParams.get('placa'),
                        vehiculo: {
                            descripcionMarca: 'HYUNDAI',
                            descripcionModelo: 'ELANTRA',
                            anioAuto: 2009,
                        },
                    },
                },
                { status }
            );
        }
    );

    const buscar = (placa: string) =>
        servidor(
            new Request('https://sucolor.example/consulta-placa', {
                method: 'POST',
                headers: { Authorization: 'Bearer sesion-de-pruebas' },
                body: JSON.stringify({ placa }),
            })
        );

    return { buscar, llamadas };
}

describe('Cupos de la API vehicular', () => {
    it('salta las claves agotadas, recuerda el 429 y reutiliza una respuesta por placa', async () => {
        const { buscar, llamadas } = prepararConsulta({
            original: 429,
            'respaldo-1': 429,
            'respaldo-2': 200,
        });
        const { status, json } = await buscar('PBL-9929').then(async r => ({
            status: r.status,
            json: await r.json(),
        }));
        expect(status).toBe(200);
        expect(json).toEqual({ marca: 'HYUNDAI', modelo: 'ELANTRA', anio: '2009' });
        await buscar('pbl9929');
        await buscar('LAA1362');
        expect(llamadas).toEqual(['original', 'respaldo-1', 'respaldo-2', 'respaldo-2']);
    });

    it('devuelve cupo agotado si las tres claves responden 429', async () => {
        const { buscar, llamadas } = prepararConsulta({
            original: 429,
            'respaldo-1': 429,
            'respaldo-2': 429,
        });
        const respuesta = await buscar('PBL9929');
        expect(respuesta.status).toBe(429);
        expect(await respuesta.json()).toEqual({ codigo: 'cupo_agotado' });
        expect(llamadas).toHaveLength(3);
    });

    it.each([404, 502])(
        'conserva el resultado HTTP %s sin consumir las otras claves',
        async status => {
            const { buscar, llamadas } = prepararConsulta({
                original: status,
                'respaldo-1': 200,
                'respaldo-2': 200,
            });
            expect((await buscar('PBL9929')).status).toBe(status);
            expect(llamadas).toEqual(['original']);
        }
    );
});
