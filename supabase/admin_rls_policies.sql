-- ─── Política RLS completa para SuColor Admin ────────────────────────────────
-- Ejecuta en: Supabase Dashboard → SQL Editor

-- ordenes: admin puede leer, crear y actualizar
CREATE POLICY "Admin lee ordenes" ON ordenes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin crea ordenes" ON ordenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualiza ordenes" ON ordenes FOR UPDATE TO authenticated USING (true);

-- clientes: admin puede leer y crear
CREATE POLICY "Admin lee clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin crea clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (true);

-- vehiculos: admin puede leer y crear
CREATE POLICY "Admin lee vehiculos" ON vehiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin crea vehiculos" ON vehiculos FOR INSERT TO authenticated WITH CHECK (true);

-- media: admin puede leer y crear
CREATE POLICY "Admin lee media" ON media FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin crea media" ON media FOR INSERT TO authenticated WITH CHECK (true);
