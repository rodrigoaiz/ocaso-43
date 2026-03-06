-- ============================================
-- MIGRACIÓN: Agregar campo 'rol' y usuario Miguel
-- ============================================
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna 'rol' a la tabla comision_usuarios
ALTER TABLE comision_usuarios 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'votante' 
CHECK (rol IN ('votante', 'observador'));

-- 2. Actualizar usuarios existentes para que tengan rol 'votante'
UPDATE comision_usuarios 
SET rol = 'votante' 
WHERE rol IS NULL;

-- 3. Insertar usuario Miguel (observador)
-- IMPORTANTE: Reemplaza <HASH_DE_MIGUEL> con el hash generado por npm run hash-passwords
-- El hash para la contraseña 'Migu3l&Cv43!2026' es:
-- $2b$10$hzKS8jTO89SPVqNQfv2Z4uJ5qXlcqbGfIQROfH3Z3AJvEx3Rv0bwy

INSERT INTO comision_usuarios (username, password_hash, rol, activo) VALUES
('miguel', '$2b$10$hzKS8jTO89SPVqNQfv2Z4uJ5qXlcqbGfIQROfH3Z3AJvEx3Rv0bwy', 'observador', true)
ON CONFLICT (username) DO NOTHING;

-- 4. Verificar que todo está correcto
SELECT username, rol, activo, created_at FROM comision_usuarios ORDER BY created_at;
