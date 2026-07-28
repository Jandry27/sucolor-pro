CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: solo admins pueden leer, insertar se hace con privileges
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin lee audit_log" ON audit_log
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin inserta audit_log" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
