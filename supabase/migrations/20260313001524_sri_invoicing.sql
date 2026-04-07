-- Add 'direccion' and 'tipo_identificacion' to clientes if they don't exist
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tipo_identificacion text DEFAULT '05'; -- 05 is Cédula, 04 RUC, etc.

-- Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ruc text NOT NULL,
    razon_social text NOT NULL,
    nombre_comercial text,
    direccion_matriz text NOT NULL,
    obligado_contabilidad boolean DEFAULT false,
    contribuyente_especial text, -- Should be the resolution number if applicable
    rimpe boolean DEFAULT false,
    agente_retencion text,
    p12_storage_path text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure there is only one row in company_settings or allow multiple if they have multiple branches (we'll assume single for now)
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users to company_settings"
    ON public.company_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for authenticated users to company_settings"
    ON public.company_settings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    orden_id uuid REFERENCES public.ordenes(id) ON DELETE CASCADE,
    secuencial text, -- e.g. 001-001-000000001
    clave_acceso text,
    estado text DEFAULT 'CREADA', -- CREADA, FIRMADA, RECIBIDA, AUTORIZADA, RECHAZADA
    ambiente integer DEFAULT 1, -- 1 = Pruebas, 2 = Producción
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
    mensajes_sri jsonb, -- Error or info messages from SRI
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users to invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for authenticated users to invoices"
    ON public.invoices FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
    codigo_principal text NOT NULL,
    descripcion text NOT NULL,
    cantidad numeric NOT NULL DEFAULT 1,
    precio_unitario numeric NOT NULL,
    descuento numeric DEFAULT 0,
    precio_total_sin_impuestos numeric NOT NULL,
    codigo_porcentaje_iva integer NOT NULL, -- 0 = 0%, 2 = 12%, 3 = 14%, 4 = 15% etc.
    tarifa_iva numeric NOT NULL, -- 0 or 15
    valor_iva numeric NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users to invoice_items"
    ON public.invoice_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for authenticated users to invoice_items"
    ON public.invoice_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
