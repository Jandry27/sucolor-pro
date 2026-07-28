-- Asegurar que sign-up público esté DESHABILITADO en Supabase Dashboard
-- Settings → Auth → User Signups → Disable "Enable sign up"

-- Actualizar políticas para verificar is_admin()

-- ORDENES
DROP POLICY IF EXISTS "Admin lee ordenes" ON ordenes;
DROP POLICY IF EXISTS "Admin crea ordenes" ON ordenes;
DROP POLICY IF EXISTS "Admin actualiza ordenes" ON ordenes;

CREATE POLICY "Solo admin lee ordenes" ON ordenes
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin crea ordenes" ON ordenes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Solo admin actualiza ordenes" ON ordenes
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin borra ordenes" ON ordenes
  FOR DELETE TO authenticated USING (public.is_admin());

-- CLIENTES
DROP POLICY IF EXISTS "Admin lee clientes" ON clientes;
DROP POLICY IF EXISTS "Admin crea clientes" ON clientes;

CREATE POLICY "Solo admin lee clientes" ON clientes
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin crea clientes" ON clientes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Solo admin actualiza clientes" ON clientes
  FOR UPDATE TO authenticated USING (public.is_admin());

-- VEHICULOS
DROP POLICY IF EXISTS "Admin lee vehiculos" ON vehiculos;
DROP POLICY IF EXISTS "Admin crea vehiculos" ON vehiculos;

CREATE POLICY "Solo admin lee vehiculos" ON vehiculos
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin crea vehiculos" ON vehiculos
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Solo admin actualiza vehiculos" ON vehiculos
  FOR UPDATE TO authenticated USING (public.is_admin());

-- MEDIA
DROP POLICY IF EXISTS "media_select_auth" ON media;
DROP POLICY IF EXISTS "media_insert_auth" ON media;
DROP POLICY IF EXISTS "media_update_auth" ON media;
DROP POLICY IF EXISTS "media_delete_auth" ON media;

CREATE POLICY "Solo admin lee media" ON media
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin crea media" ON media
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Solo admin actualiza media" ON media
  FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Solo admin borra media" ON media
  FOR DELETE TO authenticated USING (public.is_admin());
