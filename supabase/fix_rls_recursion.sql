-- =====================================================================
-- FIX: stack depth limit exceeded (error 54001) en SuColor
-- =====================================================================
-- Este error ocurre porque alguna política RLS llama a is_admin()
-- que a su vez consulta la tabla `profiles` que también tiene RLS,
-- creando una recursión infinita.
--
-- SOLUCIÓN: Usar SECURITY DEFINER en is_admin() con SET search_path
-- O usar auth.uid() directamente en las políticas sin funciones recursivas.
--
-- PASO 1: Ver qué políticas existen en vehiculos
-- =====================================================================

-- Diagnóstico: ver todas las políticas de RLS activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('vehiculos', 'clientes', 'ordenes', 'profiles', 'media')
ORDER BY tablename, policyname;

-- =====================================================================
-- PASO 2: Fix — Recrear is_admin() con SECURITY DEFINER para evitar recursión
-- =====================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- =====================================================================
-- PASO 3: Si el problema persiste, revisar si profiles tiene RLS
-- que también llame a is_admin().
-- Si es así, las políticas de profiles deben usar auth.uid() directamente:
-- =====================================================================

-- Ver si profiles tiene RLS habilitado:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- Opción alternativa: si profiles tiene políticas de RLS que llaman is_admin(),
-- cambia la política de profiles para que use auth.uid() directamente:
-- DROP POLICY IF EXISTS "Admin can read profiles" ON profiles;
-- CREATE POLICY "Users read own profile" ON profiles
--   FOR SELECT TO authenticated
--   USING (id = auth.uid());
