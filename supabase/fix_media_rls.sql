-- =========================================================
-- SuColor — Fix CRÍTICO: Recursión RLS tabla media
-- Error: "stack depth limit exceeded" (code 54001)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =========================================================

-- 1. Deshabilitar RLS temporalmente
ALTER TABLE public.media DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes de media
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'media' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.media', pol.policyname);
    END LOOP;
END
$$;

-- 3. Volver a habilitar RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas simples SIN funciones que consulten otras tablas
-- (evitar is_admin() que puede causar recursión)
CREATE POLICY "media_select_auth" ON public.media
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "media_insert_auth" ON public.media
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "media_update_auth" ON public.media
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "media_delete_auth" ON public.media
  FOR DELETE TO authenticated USING (true);

-- 5. Verificar que quedaron bien (debe mostrar 4 filas):
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'media';
