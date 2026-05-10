-- =========================================================
-- SuColor — Añadir columnas de pago a tabla ordenes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =========================================================

ALTER TABLE public.ordenes
  ADD COLUMN IF NOT EXISTS precio_total  numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_entrada numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_pagado  numeric(10,2) DEFAULT 0;

-- Verifica:
-- SELECT codigo, precio_total, monto_entrada, monto_pagado FROM public.ordenes LIMIT 5;
