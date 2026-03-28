-- Tabla de Tickets / Solicitudes de Residentes
-- Condominio Ocaso 43

CREATE TABLE IF NOT EXISTS tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now() NOT NULL,
  titulo          text NOT NULL,
  descripcion     text NOT NULL,
  categoria       text NOT NULL CHECK (categoria IN ('reporte', 'solicitud', 'sugerencia')),
  nombre          text NOT NULL,
  departamento    text NOT NULL,
  estado          text NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_proceso', 'resuelto')),
  respuesta       text,
  respondido_at   timestamptz,
  respondido_por  text
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS tickets_estado_idx    ON tickets (estado);
CREATE INDEX IF NOT EXISTS tickets_created_idx   ON tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS tickets_categoria_idx ON tickets (categoria);

-- Comentarios
COMMENT ON TABLE tickets IS 'Solicitudes, quejas y sugerencias de los residentes del Condominio Ocaso 43';
COMMENT ON COLUMN tickets.categoria IS 'queja | solicitud | sugerencia';
COMMENT ON COLUMN tickets.estado    IS 'abierto | en_proceso | resuelto';
