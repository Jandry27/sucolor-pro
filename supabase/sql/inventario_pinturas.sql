-- ============================================================
--  Módulo: Inventario de Pinturas Sobrantes (simplificado)
--  Campos: placa, color, codigo_color
--  NOTA: Elimina y recrea la tabla con el esquema correcto
-- ============================================================

-- 1. Eliminar tabla anterior (si existe) y recrear
DROP TABLE IF EXISTS public.inventario_pinturas CASCADE;

CREATE TABLE public.inventario_pinturas (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    placa        TEXT        NOT NULL,
    color        TEXT        NOT NULL,
    codigo_color TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índice para búsqueda rápida por placa
CREATE INDEX IF NOT EXISTS idx_inventario_pinturas_placa
    ON public.inventario_pinturas (LOWER(placa));

-- 3. Trigger para updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventario_pinturas_updated_at ON public.inventario_pinturas;
CREATE TRIGGER trg_inventario_pinturas_updated_at
    BEFORE UPDATE ON public.inventario_pinturas
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Habilitar RLS
ALTER TABLE public.inventario_pinturas ENABLE ROW LEVEL SECURITY;

-- 5. Políticas: solo usuarios autenticados (admin)
DROP POLICY IF EXISTS "admin_select_pinturas" ON public.inventario_pinturas;
CREATE POLICY "admin_select_pinturas"
    ON public.inventario_pinturas FOR SELECT
    TO authenticated USING (TRUE);

DROP POLICY IF EXISTS "admin_insert_pinturas" ON public.inventario_pinturas;
CREATE POLICY "admin_insert_pinturas"
    ON public.inventario_pinturas FOR INSERT
    TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_update_pinturas" ON public.inventario_pinturas;
CREATE POLICY "admin_update_pinturas"
    ON public.inventario_pinturas FOR UPDATE
    TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "admin_delete_pinturas" ON public.inventario_pinturas;
CREATE POLICY "admin_delete_pinturas"
    ON public.inventario_pinturas FOR DELETE
    TO authenticated USING (TRUE);
