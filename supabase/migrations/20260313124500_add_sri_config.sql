-- Add new SRI configuration fields to company_settings
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS establecimiento text DEFAULT '001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS punto_emision text DEFAULT '001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS secuencial_factura text DEFAULT '00000001';
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS p12_password text;

-- Optional: Initial seed for the user's specific request
UPDATE public.company_settings
SET 
    establecimiento = '001',
    punto_emision = '100',
    secuencial_factura = '00000059',
    nombre_comercial = 'su color',
    direccion_matriz = 'Machala en jaramijo',
    p12_password = 'Consuelo20243'
WHERE true; -- Applies to the single existing row
