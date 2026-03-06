-- Migration 002: Add Multi-Option Voting System
-- Descripción: Agrega soporte para votación de selección de productos (múltiples opciones)
-- Fecha: 2026-03-06

-- 1. Agregar tipo_votacion a proyectos_votacion
ALTER TABLE proyectos_votacion 
  ADD COLUMN tipo_votacion TEXT DEFAULT 'binaria' 
  CHECK (tipo_votacion IN ('binaria', 'seleccion'));

COMMENT ON COLUMN proyectos_votacion.tipo_votacion IS 'Tipo de votación: binaria (a favor/en contra) o seleccion (múltiples opciones de productos)';

-- 2. Crear tabla opciones_producto para almacenar las opciones de votación
CREATE TABLE opciones_producto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos_votacion(id) ON DELETE CASCADE,
  opcion_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  precio NUMERIC,
  descripcion_corta TEXT,
  orden INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proyecto_id, opcion_id)
);

CREATE INDEX idx_opciones_proyecto ON opciones_producto(proyecto_id);

COMMENT ON TABLE opciones_producto IS 'Opciones de productos para votaciones de tipo selección';
COMMENT ON COLUMN opciones_producto.opcion_id IS 'ID de la opción definido en el MDX (ej: "opcion-1")';
COMMENT ON COLUMN opciones_producto.orden IS 'Orden de presentación de la opción';

-- 3. Modificar tabla votos para soportar ambos tipos de votación
ALTER TABLE votos 
  ADD COLUMN opcion_producto_id UUID REFERENCES opciones_producto(id) ON DELETE CASCADE;

COMMENT ON COLUMN votos.opcion_producto_id IS 'Referencia a opción de producto (solo para votaciones tipo selección)';

-- 4. Hacer nullable la columna voto (antes NOT NULL)
ALTER TABLE votos 
  ALTER COLUMN voto DROP NOT NULL;

-- 5. Agregar constraint de validación: un voto debe ser binario O de selección
ALTER TABLE votos 
  ADD CONSTRAINT check_voto_valido 
  CHECK (
    (voto IS NOT NULL AND opcion_producto_id IS NULL) OR 
    (voto IS NULL AND opcion_producto_id IS NOT NULL)
  );

COMMENT ON CONSTRAINT check_voto_valido ON votos IS 'Asegura que un voto sea binario (voto) o de selección (opcion_producto_id), pero no ambos';

-- Rollback instructions (commented):
-- ALTER TABLE votos DROP CONSTRAINT check_voto_valido;
-- ALTER TABLE votos ALTER COLUMN voto SET NOT NULL;
-- ALTER TABLE votos DROP COLUMN opcion_producto_id;
-- DROP TABLE opciones_producto;
-- ALTER TABLE proyectos_votacion DROP COLUMN tipo_votacion;
