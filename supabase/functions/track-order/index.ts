// track-order Edge Function (FINAL — con signed URLs + cliente/vehiculo)
// @ts-nocheck
// Copia este código en Supabase → Edge Functions → track-order → Edit

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

        // ── Rate limiting: máximo 60 requests/hora por IP ──────────────────────
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        const allowed = await checkRateLimit(supabase, clientIp, 'track-order', 60);
        if (!allowed) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── Validación robusta de parámetros (sin Zod, validación manual para Deno)
        const url = new URL(req.url);
        const codigoRaw = url.searchParams.get('codigo')?.trim() ?? '';
        const tokenRaw = url.searchParams.get('token')?.trim() ?? '';

        // Validar código: solo letras mayúsculas, números y guión, 3-20 chars
        const codigoValido = /^[A-Z0-9-]{3,20}$/.test(codigoRaw.toUpperCase());
        // Validar token: alfanumérico + guiones, mínimo 20 chars
        const tokenValido = /^[a-zA-Z0-9_-]{20,255}$/.test(tokenRaw);

        if (!codigoRaw || !tokenRaw || !codigoValido || !tokenValido) {
            return new Response(JSON.stringify({ ok: false, error: 'Parámetros inválidos.' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const codigo = codigoRaw.toUpperCase();
        const token = tokenRaw;

        // 1. Buscar la orden por código
        const { data: orden, error: ordErr } = await supabase
            .from('ordenes')
            .select(
                'id, codigo, estado, prioridad, fecha_ingreso, fecha_estimada, notas_publicas, share_enabled, share_token, cliente_id, vehiculo_id'
            )
            .eq('codigo', codigo)
            .single();

        if (ordErr || !orden) {
            return new Response(JSON.stringify({ ok: false, error: 'Orden no encontrada.' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!orden.share_enabled) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    error: 'El portal de seguimiento para esta orden está desactivado.',
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (orden.share_token !== token) {
            return new Response(JSON.stringify({ ok: false, error: 'Token inválido.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Obtener cliente y vehículo (queries separadas, sin FK joins)
        const [{ data: cliente }, { data: vehiculo }] = await Promise.all([
            supabase
                .from('clientes')
                .select('nombres, telefono')
                .eq('id', orden.cliente_id)
                .single(),
            supabase
                .from('vehiculos')
                .select('marca, modelo, anio, color, placa')
                .eq('id', orden.vehiculo_id)
                .single(),
        ]);

        // 3. Obtener gastos (para reemplazar el timeline anterior)
        const { data: gastosRows, error: gastosErr } = await supabase
            .from('orden_gastos')
            .select('id, descripcion, monto, factura_url, created_at')
            .eq('orden_id', orden.id)
            .order('created_at', { ascending: false });

        if (gastosErr) {
            console.error('Error fetching gastos:', gastosErr);
        }

        // Mapear al modelo del frontend
        const gastos = (gastosRows ?? []).map((g: any) => ({
            id: g.id,
            descripcion: g.descripcion,
            monto: Number(g.monto),
            factura_url: g.factura_url,
            created_at: g.created_at,
        }));

        // 4. Obtener media y generar signed URLs para el bucket privado
        const { data: mediaRows } = await supabase
            .from('media')
            .select('id, tipo, categoria, storage_bucket, storage_path, url, caption')
            .eq('orden_id', orden.id)
            .order('created_at', { ascending: true });

        const media = await Promise.all(
            (mediaRows ?? []).map(async (m: Record<string, string>) => {
                let signed_url = m.url ?? '';
                if (m.storage_bucket && m.storage_path) {
                    const { data: signedData } = await supabase.storage
                        .from(m.storage_bucket)
                        .createSignedUrl(m.storage_path, 3600);
                    signed_url = signedData?.signedUrl ?? '';
                }
                return {
                    id: m.id,
                    tipo: m.tipo,
                    categoria: m.categoria,
                    signed_url,
                    descripcion: m.caption ?? null,
                };
            })
        );

        // 5. Devolver respuesta completa
        return new Response(
            JSON.stringify({
                ok: true,
                order: {
                    codigo: orden.codigo,
                    estado: orden.estado,
                    prioridad: orden.prioridad,
                    fecha_ingreso: orden.fecha_ingreso,
                    fecha_estimada: orden.fecha_estimada,
                    notas_publicas: orden.notas_publicas,
                    cliente: cliente?.nombres ?? 'Cliente',
                    vehiculo: {
                        marca: vehiculo?.marca ?? '',
                        modelo: vehiculo?.modelo ?? '',
                        anio: vehiculo?.anio ?? 0,
                        color: vehiculo?.color ?? '',
                        placa: vehiculo?.placa ?? '',
                    },
                },
                gastos: gastos ?? [],
                media,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('track-order error:', err);
        return new Response(JSON.stringify({ ok: false, error: 'Error interno del servidor.' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
