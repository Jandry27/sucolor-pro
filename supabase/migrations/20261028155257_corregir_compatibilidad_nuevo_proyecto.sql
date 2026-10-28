-- Compatibilidad con los campos opcionales del formulario de vehículos.
ALTER TABLE public.vehiculos ALTER COLUMN modelo DROP NOT NULL;
ALTER TABLE public.vehiculos ALTER COLUMN color DROP NOT NULL;
ALTER TABLE public.vehiculos ALTER COLUMN anio DROP NOT NULL;

-- Un usuario no puede convertirse en administrador editando su propio perfil.
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'viewer';
DROP POLICY IF EXISTS "Profiles read" ON public.profiles;
CREATE POLICY "Profiles read" ON public.profiles FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY "Profiles admin writes" ON public.profiles FOR ALL TO authenticated
USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
ALTER POLICY "Solo admin o dueño lee roles" ON public.user_roles
USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- La firma es privada y solo puede administrarla un administrador.
DROP POLICY IF EXISTS "Firmas reads admin" ON storage.objects;
DROP POLICY IF EXISTS "Firmas uploads admin" ON storage.objects;
CREATE POLICY "Firmas admin" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'firmas' AND (SELECT public.is_admin()))
WITH CHECK (bucket_id = 'firmas' AND (SELECT public.is_admin()));

-- El límite de consultas públicas solo lo consumen las funciones del servidor.
REVOKE EXECUTE ON FUNCTION public.consume_rate_limit(text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text,text,integer) TO service_role;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.generar_codigo_orden() SET search_path = public, extensions;
CREATE INDEX IF NOT EXISTS idx_ordenes_cliente ON public.ordenes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
