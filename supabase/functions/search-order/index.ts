// Supabase Edge Function: search-order
// @ts-nocheck
// Deploy: copia este código en Supabase Dashboard → Edge Functions → New Function → "search-order"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/clienteSupabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Consulta la tabla `rate_limits` para saber si la IP ha superado el límite
// en la ventana horaria actual. Retorna true = permitido, false = bloqueado.
// Si hay cualquier error de BD, permite la request (fail-open) para no bloquear
// usuarios legítimos por problemas de infraestructura.
async function checkRateLimit(
    supabase: any,
    ip: string,
    endpoint: string,
    maxReq: number
): Promise<boolean> {
    try {
        const windowStart = new Date();
        windowStart.setMinutes(0, 0, 0);
        windowStart.setSeconds(0, 0);

        const { data: existing } = await supabase
            .from('rate_limits')
            .select('count')
            .eq('ip', ip)
            .eq('endpoint', endpoint)
            .eq('window_start', windowStart.toISOString())
            .single();

        if (existing) {
            if (existing.count >= maxReq) return false; // bloqueado
            await supabase
                .from('rate_limits')
                .update({ count: existing.count + 1 })
                .eq('ip', ip)
                .eq('endpoint', endpoint)
                .eq('window_start', windowStart.toISOString());
        } else {
            await supabase.from('rate_limits').insert({
                ip,
                endpoint,
                window_start: windowStart.toISOString(),
                count: 1,
            });
        }
        return true; // permitido
    } catch {
        return true; // si falla, no bloquear
    }
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Crear cliente de Supabase al inicio (necesario para rate limiting)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('PROJECT_URL') ?? '';
        const serviceKey =
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, serviceKey);

        // ── Rate limiting: máximo 30 requests/hora por IP (búsqueda es más sensible)
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        const allowed = await checkRateLimit(supabase, clientIp, 'search-order', 30);
        if (!allowed) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Validación robusta de parámetros (sin Zod, validación manual para Deno)
        const url = new URL(req.url);
        const placaRaw = url.searchParams.get('placa')?.trim() ?? '';
        const nombreRaw = url.searchParams.get('nombre')?.trim() ?? '';
        const apellidoRaw = url.searchParams.get('apellido')?.trim() ?? '';

        // Validar placa: solo letras mayúsculas, números y guiones, 3-10 chars
        const placaValida = placaRaw !== '' && /^[A-Z0-9-]{3,10}$/.test(placaRaw.toUpperCase());
        // Validar nombre y apellido: solo letras (con acentos y ñ) y espacios, 2-50 chars
        const nombreValido = nombreRaw !== '' && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(nombreRaw);
        const apellidoValido =
            apellidoRaw !== '' && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/.test(apellidoRaw);

        // Se requiere placa válida, o nombre + apellido ambos válidos
        if (!placaValida && !(nombreValido && apellidoValido)) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Proporciona una placa válida o nombre y apellido válidos.',
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const placa = placaValida ? placaRaw.toUpperCase() : null;
        const nombre = nombreValido ? nombreRaw : null;
        const apellido = apellidoValido ? apellidoRaw : null;

        let data, error;

        if (placa) {
            // Búsqueda por placa
            ({ data, error } = await supabase
                .from('ordenes')
                .select(
                    `
          codigo,
          share_token,
          share_enabled,
          vehiculo:vehiculos!inner(placa)
        `
                )
                .eq('vehiculos.placa', placa)
                .eq('share_enabled', true)
                .neq('estado', 'ENTREGADO')
                .order('fecha_ingreso', { ascending: false })
                .limit(1));
        } else {
            // Búsqueda por nombre + apellido
            ({ data, error } = await supabase
                .from('ordenes')
                .select(
                    `
          codigo,
          share_token,
          share_enabled,
          cliente:clientes!inner(nombres, apellidos)
        `
                )
                .ilike('clientes.nombres', nombre!)
                .ilike('clientes.apellidos', apellido!)
                .eq('share_enabled', true)
                .neq('estado', 'ENTREGADO')
                .order('fecha_ingreso', { ascending: false })
                .limit(1));
        }

        if (error || !data || data.length === 0) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'No se encontró una orden activa para los datos proporcionados.',
                }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const order = data[0];

        if (!order.share_token) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Esta orden no tiene portal de seguimiento activado.',
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ ok: true, codigo: order.codigo, token: order.share_token }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('search-order error:', err);
        return new Response(JSON.stringify({ ok: false, message: 'Error interno del servidor.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
