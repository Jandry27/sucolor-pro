-- Script para Eliminar Todos los Registros Excepto la placa PDL-6692
-- Este script es seguro de ejecutar en el 'SQL Editor' de Supabase

-- 1. Primero, creamos una tabla temporal con el ID del vehículo que queremos preservar
CREATE TEMP TABLE p_vehiculo AS 
SELECT id, cliente_id 
FROM vehiculos 
WHERE placa = 'PDL-6692';

-- 2. Eliminar todas las órdenes, excepto las asociadas a este vehículo
DELETE FROM ordenes 
WHERE vehiculo_id NOT IN (SELECT id FROM p_vehiculo);

-- 3. Eliminar todos los vehículos, excepto este
DELETE FROM vehiculos 
WHERE id NOT IN (SELECT id FROM p_vehiculo);

-- 4. Eliminar todos los medias/fotos que quedaron sin órdenes (opcionalmente Supabase hace cascade, pero por si acaso)
-- (Si tienes tabla medias, sino omite este paso)

-- 5. Eliminar todos los clientes, EXCEPTO el dueño del vehículo PDL-6692
DELETE FROM clientes 
WHERE id NOT IN (SELECT cliente_id FROM p_vehiculo WHERE cliente_id IS NOT NULL);

-- DROP de la tabla temporal al finalizar
DROP TABLE p_vehiculo;

-- FIN DEL SCRIPT
