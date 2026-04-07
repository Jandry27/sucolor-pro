-- ============================================================
-- SRI INVOICING: Setup completo para base de datos remota
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Columnas extra en clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_identificacion text DEFAULT '05';

-- 2. Company Settings (si ya existe, no hace nada)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ruc text NOT NULL,
    razon_social text NOT NULL,
    nombre_comercial text,
    direccion_matriz text NOT NULL,
    obligado_contabilidad boolean DEFAULT false,
    contribuyente_especial text,
    rimpe boolean DEFAULT false,
    agente_retencion text,
    p12_storage_path text,
    establecimiento text DEFAULT '001',
    punto_emision text DEFAULT '001',
    secuencial_factura text DEFAULT '00000001',
    p12_password text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add columns that might be missing if table existed before
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS establecimiento text DEFAULT '001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS punto_emision text DEFAULT '001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS secuencial_factura text DEFAULT '00000001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS p12_password text;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist to avoid errors
DROP POLICY IF EXISTS "Enable read access for authenticated users to company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users to company_settings" ON public.company_settings;

CREATE POLICY "Enable read access for authenticated users to company_settings"
    ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users to company_settings"
    ON public.company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_id uuid REFERENCES public.ordenes(id) ON DELETE CASCADE,
    secuencial text,
    clave_acceso text,
    estado text DEFAULT 'CREADA',
    ambiente integer DEFAULT 1,
    fecha_emision timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    subtotal_15 numeric DEFAULT 0,
    subtotal_0 numeric DEFAULT 0,
    subtotal_no_objeto numeric DEFAULT 0,
    subtotal_exento numeric DEFAULT 0,
    total_descuento numeric DEFAULT 0,
    valor_iva numeric DEFAULT 0,
    importe_total numeric DEFAULT 0,
    xml_generado text,
    autorizacion_fecha timestamp with time zone,
    mensajes_sri jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Enable all access for authenticated users to invoices" ON public.invoices;

CREATE POLICY "Enable read access for authenticated users to invoices"
    ON public.invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users to invoices"
    ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Invoice Items Table  
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
    codigo_principal text NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric NOT NULL DEFAULT 1,
    precio_unitario numeric NOT NULL,
    descuento numeric DEFAULT 0,
    precio_total_sin_impuestos numeric NOT NULL,
    codigo_porcentaje_iva integer NOT NULL,
    tarifa_iva numeric NOT NULL,
    valor_iva numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users to invoice_items" ON public.invoice_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users to invoice_items" ON public.invoice_items;

CREATE POLICY "Enable read access for authenticated users to invoice_items"
    ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users to invoice_items"
    ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Create Storage Bucket for firma electrónica
INSERT INTO storage.buckets (id, name, public) 
VALUES ('firmas', 'firmas', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for firmas bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to firmas" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from firmas" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to firmas"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'firmas');

CREATE POLICY "Allow authenticated reads from firmas"
    ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'firmas');
