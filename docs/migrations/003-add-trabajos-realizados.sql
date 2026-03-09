-- Migration 003: Add Trabajos Realizados (Completed Projects Public Display)
-- Created: 2026-03-09
-- Description: Creates tables to track and publicly display completed work/projects

-- ============================================================================
-- FORWARD MIGRATION
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table: trabajos_realizados
CREATE TABLE IF NOT EXISTS trabajos_realizados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  
  -- Optional link to approved project (can be NULL for independent work)
  proyecto_id UUID REFERENCES proyectos_votacion(id) ON DELETE SET NULL,
  
  -- Dates
  fecha_realizacion DATE NOT NULL,
  fecha_aprobacion_comision DATE,  -- NULL if not approved by committee
  
  -- Costs
  costo_final DECIMAL(10, 2) NOT NULL,  -- Actual cost paid
  presupuesto_estimado DECIMAL(10, 2),  -- Original estimated budget (from project)
  
  -- Provider
  proveedor TEXT NOT NULL,
  contacto_proveedor TEXT,
  
  -- Category
  categoria TEXT NOT NULL CHECK (categoria IN ('Mantenimiento', 'Compras', 'Mejoras', 'Emergencias', 'Reparaciones')),
  
  -- Content (synced from MDX)
  contenido TEXT,  -- Full description in Markdown
  notas TEXT,      -- Additional observations
  
  -- Visibility
  visible BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Images table: trabajo_imagenes
CREATE TABLE IF NOT EXISTS trabajo_imagenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajo_id UUID NOT NULL REFERENCES trabajos_realizados(id) ON DELETE CASCADE,
  url TEXT NOT NULL,  -- Path to image in /public/img/trabajos/
  tipo TEXT NOT NULL CHECK (tipo IN ('antes', 'durante', 'despues')),
  descripcion TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table: trabajo_documentos (optional - for future use)
CREATE TABLE IF NOT EXISTS trabajo_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trabajo_id UUID NOT NULL REFERENCES trabajos_realizados(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,  -- URL to document
  tipo TEXT NOT NULL CHECK (tipo IN ('factura', 'contrato', 'garantia', 'otro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trabajos_slug ON trabajos_realizados(slug);
CREATE INDEX IF NOT EXISTS idx_trabajos_visible ON trabajos_realizados(visible);
CREATE INDEX IF NOT EXISTS idx_trabajos_fecha ON trabajos_realizados(fecha_realizacion DESC);
CREATE INDEX IF NOT EXISTS idx_trabajos_categoria ON trabajos_realizados(categoria);
CREATE INDEX IF NOT EXISTS idx_trabajos_proyecto ON trabajos_realizados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_trabajo_imagenes_trabajo ON trabajo_imagenes(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_trabajo_documentos_trabajo ON trabajo_documentos(trabajo_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trabajos_realizados_updated_at
  BEFORE UPDATE ON trabajos_realizados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on tables
COMMENT ON TABLE trabajos_realizados IS 'Public record of completed work/projects in the building';
COMMENT ON TABLE trabajo_imagenes IS 'Before/during/after images for completed work';
COMMENT ON TABLE trabajo_documentos IS 'Invoices, contracts, warranties for completed work';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run:
--
-- DROP TRIGGER IF EXISTS update_trabajos_realizados_updated_at ON trabajos_realizados;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS trabajo_documentos CASCADE;
-- DROP TABLE IF EXISTS trabajo_imagenes CASCADE;
-- DROP TABLE IF EXISTS trabajos_realizados CASCADE;
