import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
    'https://sucolor.autos',
    'https://sucolor.vercel.app',
    'https://sucolor-jandry27s-projects.vercel.app',
    'https://sucolor-git-main-jandry27s-projects.vercel.app',
    'http://localhost:5173',
];

function isAllowedOrigin(origin: string) {
    if (!origin) return true;

    return (
        ALLOWED_ORIGINS.includes(origin) ||
        /^https:\/\/sucolor-[a-z0-9-]+-jandry27s-projects\.vercel\.app$/i.test(origin) ||
        /^http:\/\/localhost(?::\d+)?$/i.test(origin)
    );
}

function getCorsHeaders(req: Request) {
    const origin = req.headers.get('origin') || '';
    const headers: Record<string, string> = {
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };

    if (origin && isAllowedOrigin(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
    }

    return headers;
}

function onlyDigits(value: string) {
    return value.replace(/\D/g, '');
}

serve(async (req: Request) => {
    const origin = req.headers.get('origin') || '';

    if (origin && !isAllowedOrigin(origin)) {
        return new Response(JSON.stringify({ ok: false, message: 'Solicitud no permitida.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', Vary: 'Origin' },
        });
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: getCorsHeaders(req) });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, message: 'Método no permitido.' }), {
            status: 405,
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !serviceKey) {
            throw new Error('Configuración interna incompleta.');
        }

        const supabase = createClient(supabaseUrl, serviceKey);
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

        const { data: allowed, error: rateError } = await supabase.rpc('consume_rate_limit', {
            p_ip: clientIp,
            p_endpoint: 'search-order',
            p_max: 15,
        });

        if (rateError) {
            console.error('Rate limit error:', rateError);
            return new Response(JSON.stringify({ ok: false, message: 'Intenta de nuevo más tarde.' }), {
                status: 503,
                headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
            });
        }

        if (!allowed) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Demasiados intentos. Intenta de nuevo más tarde.',
                }),
                {
                    status: 429,
                    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
                }
            );
        }

        const body = await req.json().catch(() => null);
        const placaRaw = typeof body?.placa === 'string' ? body.placa.trim().toUpperCase() : '';
        const verificadorRaw =
            typeof body?.verificador === 'string' ? onlyDigits(body.verificador).slice(-4) : '';

        const placaValida = /^[A-Z0-9-]{3,10}$/.test(placaRaw);
        const verificadorValido = /^\d{4}$/.test(verificadorRaw);

        if (!placaValida || !verificadorValido) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'No se pudo validar la información proporcionada.',
                }),
                {
                    status: 400,
                    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
                }
            );
        }

        const { data: orders, error } = await supabase
            .from('ordenes')
            .select(
                `
                codigo,
                share_token,
                share_enabled,
                fecha_ingreso,
                estado,
                cliente:clientes!inner(telefono),
                vehiculo:vehiculos!inner(placa)
            `
            )
            .eq('vehiculos.placa', placaRaw)
            .eq('share_enabled', true)
            .neq('estado', 'ENTREGADO')
            .order('fecha_ingreso', { ascending: false })
            .limit(1);

        const order = orders?.[0];
        const telefono = onlyDigits(order?.cliente?.telefono ?? '');
        const coincide = telefono.length >= 4 && telefono.slice(-4) === verificadorRaw;

        if (error || !order || !order.share_token || !coincide) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'No se pudo validar la información proporcionada.',
                }),
                {
                    status: 404,
                    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(
            JSON.stringify({
                ok: true,
                codigo: order.codigo,
                token: order.share_token,
            }),
            {
                status: 200,
                headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('search-order error:', error);
        return new Response(
            JSON.stringify({
                ok: false,
                message: 'No se pudo procesar la solicitud.',
            }),
            {
                status: 500,
                headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
            }
        );
    }
});
