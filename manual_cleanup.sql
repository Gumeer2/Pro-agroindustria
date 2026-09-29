-- ⚠️ EJECUTAR EN PHPMYADMIN (Pestaña SQL) ⚠️
-- Este script limpia la base de datos LOCAL para que coincida con lo que se espera en producción.

START TRANSACTION;

-- ---------------------------------------------------------
-- 1. UNIFICAR "Blue Commander"
-- ---------------------------------------------------------
-- Identificar el ID Maestro (El más reciente)
SET @blue_master_id = (SELECT id FROM vessels WHERE name LIKE '%Blue Commander%' ORDER BY created_at DESC LIMIT 1);

-- Actualizar Operadores: Moverlos al maestro. 
-- Si hay colisión (mismo operador en ambos), SQL podría dar error, así que usamos IGNORE para saltar duplicados exactos si la clave única lo impide,
-- O mejor, actualizamos ignorando fallos y luego borramos huérfanos.
UPDATE IGNORE vessel_operators SET vessel_id = @blue_master_id WHERE vessel_id IN (SELECT id FROM vessels WHERE name LIKE '%Blue Commander%');

-- Actualizar Órdenes de Embarque
UPDATE IGNORE shipment_orders SET vessel_id = @blue_master_id WHERE vessel_id IN (SELECT id FROM vessels WHERE name LIKE '%Blue Commander%');

-- Borrar los barcos duplicados (que no sean el maestro)
DELETE FROM vessels WHERE name LIKE '%Blue Commander%' AND id != @blue_master_id;


-- ---------------------------------------------------------
-- 2. UNIFICAR "Nordorinoco"
-- ---------------------------------------------------------
-- Identificar el ID Maestro (El más reciente)
SET @nord_master_id = (SELECT id FROM vessels WHERE name LIKE '%Nordorinoco%' ORDER BY created_at DESC LIMIT 1);

-- Actualizar Operadores
UPDATE IGNORE vessel_operators SET vessel_id = @nord_master_id WHERE vessel_id IN (SELECT id FROM vessels WHERE name LIKE '%Nordorinoco%');

-- Actualizar Órdenes de Embarque
UPDATE IGNORE shipment_orders SET vessel_id = @nord_master_id WHERE vessel_id IN (SELECT id FROM vessels WHERE name LIKE '%Nordorinoco%');

-- Borrar los barcos duplicados
DELETE FROM vessels WHERE name LIKE '%Nordorinoco%' AND id != @nord_master_id;


-- ---------------------------------------------------------
-- 3. ELIMINAR EL RESTO (Basura)
-- ---------------------------------------------------------
-- Borrar cualquier barco que NO sea los maestros identificados
DELETE FROM vessels WHERE id != @blue_master_id AND id != @nord_master_id;

-- ---------------------------------------------------------
-- Confirmar
COMMIT;

SELECT * FROM vessels; -- Debería mostrar solo 2 filas confirmadas.
