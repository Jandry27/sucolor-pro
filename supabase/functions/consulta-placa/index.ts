import { crearConsultaPlaca } from './handler.ts';

Deno.serve(
    crearConsultaPlaca({
        supabaseUrl: Deno.env.get('SUPABASE_URL')!,
        supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY')!,
        hexasoftApiKeys: (
            Deno.env.get('HEXASOFT_API_KEYS') ??
            Deno.env.get('HEXASOFT_API_KEY') ??
            ''
        ).split(','),
    })
);
