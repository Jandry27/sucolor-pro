import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string || '';

if (!SUPABASE_URL) {
    console.warn('[SuColor] VITE_SUPABASE_URL no configurado en .env');
}
if (!SUPABASE_ANON_KEY) {
    console.warn('[SuColor] VITE_SUPABASE_ANON_KEY no configurado en .env — Panel Admin no disponible hasta configurar.');
}

// Always create a client (empty strings result in a no-op client rather than a crash)
export const supabase = createClient(
    SUPABASE_URL || 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY || 'placeholder-key'
);
