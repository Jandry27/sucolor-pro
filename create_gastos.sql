CREATE TABLE IF NOT EXISTS public.orden_gastos (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    monto NUMERIC(10, 2) DEFAULT 0,
    factura_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.orden_gastos ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para Administradores
CREATE POLICY ""Permitir todo en orden_gastos"" 
ON public.orden_gastos FOR ALL USING (true);
