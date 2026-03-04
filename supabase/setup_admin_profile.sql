-- =========================================================
-- SuColor Admin — Activar perfil de administrador
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =========================================================

-- Este script inserta tu usuario en la tabla profiles
-- para que is_admin() devuelva true y las políticas RLS funcionen.

-- Paso 1: Encuentra tu user_id (el email con que haces login)
-- SELECT id FROM auth.users WHERE email = 'alexischamba28@gmail.com';

-- Paso 2: Inserta el perfil admin (reemplaza el UUID con el que salió arriba)
INSERT INTO public.profiles (id, role, full_name)
SELECT id, 'admin', 'Alexis Chamba'
FROM auth.users
WHERE email = 'alexischamba28@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verificar que funcionó:
-- SELECT * FROM public.profiles;
-- SELECT public.is_admin();  -- debe devolver true
