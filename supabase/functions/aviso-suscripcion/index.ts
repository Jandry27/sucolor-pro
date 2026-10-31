import { createClient } from 'npm:@supabase/supabase-js@2.105.4';
import { crearHandler } from './handler.ts';
Deno.serve(
    crearHandler({
        async autorizar(token) {
            const cliente = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_ANON_KEY')!,
                {
                    global: { headers: { Authorization: `Bearer ${token}` } },
                    auth: { persistSession: false, autoRefreshToken: false },
                }
            );
            const { data, error } = await cliente.auth.getUser(token);
            if (error || !data.user) return 'sin_sesion';
            const permiso = await cliente.rpc('is_admin');
            return !permiso.error && permiso.data === true ? 'admin' : 'denegado';
        },
        async consultar() {
            const url = Deno.env.get('SIXELA_AVISOS_URL');
            const clave = Deno.env.get('SIXELA_INSTALACION_TOKEN');
            if (!url || !clave || new URL(url).protocol !== 'https:')
                throw new Error('Integración pendiente');
            const respuesta = await fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${clave}` },
                signal: AbortSignal.timeout(4000),
                redirect: 'error',
            });
            if (!respuesta.ok) throw new Error('Consulta fallida');
            return respuesta.json();
        },
        async guardarVigencia(vigencia) {
            const clientePrivado = createClient(
                Deno.env.get('SUPABASE_URL')!,
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
                { auth: { persistSession: false, autoRefreshToken: false } }
            );
            const { error } = await clientePrivado
                .from('estado_suscripcion_sucolor')
                .upsert({ unico: true, ...vigencia, actualizado_en: new Date().toISOString() });
            if (error) throw error;
        },
    })
);
