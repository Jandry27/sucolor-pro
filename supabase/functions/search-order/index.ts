// Supabase Edge Function: search-order
// @ts-nocheck
// Deploy: copia este código en Supabase Dashboard → Edge Functions → New Function → "search-order"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const placa = url.searchParams.get("placa")?.toUpperCase().trim();
        const nombre = url.searchParams.get("nombre")?.trim();
        const apellido = url.searchParams.get("apellido")?.trim();

        if (!placa && (!nombre || !apellido)) {
            return new Response(
                JSON.stringify({ ok: false, message: "Proporciona placa o nombre+apellido" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Usa los secrets que configuraste: PROJECT_URL y SERVICE_ROLE_KEY
        // (Supabase también inyecta SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY automáticamente)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

        const supabase = createClient(supabaseUrl, serviceKey);

        let data, error;

        if (placa) {
            // Búsqueda por placa
            ({ data, error } = await supabase
                .from("ordenes")
                .select(`
          codigo,
          share_token,
          share_enabled,
          vehiculo:vehiculos!inner(placa)
        `)
                .eq("vehiculos.placa", placa)
                .eq("share_enabled", true)
                .neq("estado", "ENTREGADO")
                .order("fecha_ingreso", { ascending: false })
                .limit(1));
        } else {
            // Búsqueda por nombre + apellido
            ({ data, error } = await supabase
                .from("ordenes")
                .select(`
          codigo,
          share_token,
          share_enabled,
          cliente:clientes!inner(nombres, apellidos)
        `)
                .ilike("clientes.nombres", nombre!)
                .ilike("clientes.apellidos", apellido!)
                .eq("share_enabled", true)
                .neq("estado", "ENTREGADO")
                .order("fecha_ingreso", { ascending: false })
                .limit(1));
        }

        if (error || !data || data.length === 0) {
            return new Response(
                JSON.stringify({ ok: false, message: "No se encontró una orden activa para los datos proporcionados." }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const order = data[0];

        if (!order.share_token) {
            return new Response(
                JSON.stringify({ ok: false, message: "Esta orden no tiene portal de seguimiento activado." }),
                { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ ok: true, codigo: order.codigo, token: order.share_token }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("search-order error:", err);
        return new Response(
            JSON.stringify({ ok: false, message: "Error interno del servidor." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
