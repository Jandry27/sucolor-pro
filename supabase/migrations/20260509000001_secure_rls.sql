-- ─────────────────────────────────────────────────────────────────────────────
-- Migración : 20260509000001_secure_rls.sql
-- Propósito : Endurece la seguridad de Row Level Security (RLS) del proyecto.
--             1) Crea la tabla `user_roles` para gestionar roles admin/viewer.
--             2) Crea la función `public.is_admin()` con SECURITY DEFINER para
--                que las políticas no puedan ser eludidas por el usuario actual.
--             3) Crea la tabla `rate_limits` para control de tasa en Edge Functions.
--             4) Elimina y recrea las políticas RLS inseguras (USING(true)) de
--                ordenes, clientes, vehiculos y media; y agrega políticas para
--                orden_gastos que actualmente no las tiene.
--             Todas las políticas usan `public.is_admin()` en lugar de `true`.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. Tabla user_roles ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT        NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Cada usuario autenticado solo puede ver su(s) propio(s) rol(es)
CREATE POLICY "Solo admin lee roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- ─── 2. Función is_admin() con SECURITY DEFINER ───────────────────────────────
-- SECURITY DEFINER: se ejecuta con los permisos del dueño de la función
-- (postgres), evitando que un usuario con privilegios bajos eluda la verificación.
-- SET search_path = public: previene ataques de search_path hijacking.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;


-- ─── 3. Tabla rate_limits (usada por las Edge Functions) ─────────────────────
-- Lleva la cuenta de requests por IP, endpoint y ventana de 1 hora.
-- Las Edge Functions gestionan el UPSERT directamente (sin trigger).
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ip           TEXT        NOT NULL,
  endpoint     TEXT        NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', now()),
  count        INTEGER     NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ip, endpoint, window_start)
);

-- Índice para consultar y limpiar registros por ventana de tiempo
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);


-- ─── 4. Reemplazar políticas RLS inseguras ────────────────────────────────────
-- Eliminamos cada política que usaba USING(true) / WITH CHECK(true).

-- ── ordenes ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin lee ordenes"       ON public.ordenes;
DROP POLICY IF EXISTS "Admin crea ordenes"      ON public.ordenes;
DROP POLICY IF EXISTS "Admin actualiza ordenes" ON public.ordenes;

CREATE POLICY "Admin lee ordenes"
  ON public.ordenes FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin crea ordenes"
  ON public.ordenes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza ordenes"
  ON public.ordenes FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin borra ordenes"
  ON public.ordenes FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── clientes ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin lee clientes"  ON public.clientes;
DROP POLICY IF EXISTS "Admin crea clientes" ON public.clientes;

CREATE POLICY "Admin lee clientes"
  ON public.clientes FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin crea clientes"
  ON public.clientes FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza clientes"
  ON public.clientes FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin borra clientes"
  ON public.clientes FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── vehiculos ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin lee vehiculos"  ON public.vehiculos;
DROP POLICY IF EXISTS "Admin crea vehiculos" ON public.vehiculos;

CREATE POLICY "Admin lee vehiculos"
  ON public.vehiculos FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin crea vehiculos"
  ON public.vehiculos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza vehiculos"
  ON public.vehiculos FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin borra vehiculos"
  ON public.vehiculos FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── media ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admin lee media"  ON public.media;
DROP POLICY IF EXISTS "Admin crea media" ON public.media;

CREATE POLICY "Admin lee media"
  ON public.media FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin crea media"
  ON public.media FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza media"
  ON public.media FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin borra media"
  ON public.media FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── orden_gastos (sin políticas previas, se crean aquí) ──────────────────────
CREATE POLICY "Admin lee orden_gastos"
  ON public.orden_gastos FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin crea orden_gastos"
  ON public.orden_gastos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin actualiza orden_gastos"
  ON public.orden_gastos FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin borra orden_gastos"
  ON public.orden_gastos FOR DELETE TO authenticated
  USING (public.is_admin());


-- ─────────────────────────────────────────────────────────────────────────────
-- INSTRUCCIONES POST-MIGRACIÓN:
-- Ejecutar después de aplicar esta migración para dar acceso al primer admin:
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'TU_EMAIL@sucolor.com'
-- ON CONFLICT DO NOTHING;
-- ─────────────────────────────────────────────────────────────────────────────
