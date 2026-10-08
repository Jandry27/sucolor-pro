-- La ausencia de datos del cliente no debe impedir registrar el vehículo y su trabajo.
-- Conserva las claves foráneas y los registros históricos; no elimina contactos.
alter table public.vehiculos alter column cliente_id drop not null;
alter table public.ordenes alter column cliente_id drop not null;
