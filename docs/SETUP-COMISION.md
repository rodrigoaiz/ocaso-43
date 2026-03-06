# Configuración del Sistema de Votación - Comisión de Vigilancia

Este documento detalla los pasos necesarios para configurar el sistema de votación de la Comisión de Vigilancia que utiliza Supabase como base de datos.

## Requisitos Previos

- Cuenta de Supabase (gratuita)
- Node.js y npm instalados
- Acceso al repositorio del proyecto

---

## 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Click en "New Project"
4. Completa los datos:
   - **Project Name**: `ocaso-43-reportes` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Selecciona la región más cercana (ej: South America)
   - **Pricing Plan**: Free
5. Click en "Create new project"
6. Espera 2-3 minutos mientras Supabase configura tu base de datos

---

## 2. Ejecutar Script SQL

Una vez que tu proyecto esté listo:

1. En el panel lateral de Supabase, ve a **SQL Editor**
2. Click en "New Query"
3. Copia y pega el siguiente script SQL completo:

\`\`\`sql
-- ============================================
-- TABLAS
-- ============================================

-- Tabla de usuarios de la comisión
CREATE TABLE comision_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) DEFAULT 'votante' CHECK (rol IN ('votante', 'observador')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de proyectos para votación
CREATE TABLE proyectos_votacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  titulo VARCHAR(255) NOT NULL,
  mes INTEGER CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER,
  categoria VARCHAR(100),
  presupuesto_estimado DECIMAL(10,2),
  proveedor VARCHAR(255),
  votacion_completa BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de votos
CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos_votacion(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES comision_usuarios(id) ON DELETE CASCADE,
  voto VARCHAR(20) NOT NULL CHECK (voto IN ('a_favor', 'en_contra')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_voto_por_usuario UNIQUE(proyecto_id, usuario_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_comision_usuarios_username ON comision_usuarios(username);
CREATE INDEX idx_proyectos_slug ON proyectos_votacion(slug);
CREATE INDEX idx_proyectos_completa ON proyectos_votacion(votacion_completa);
CREATE INDEX idx_votos_proyecto ON votos(proyecto_id);
CREATE INDEX idx_votos_usuario ON votos(usuario_id);

-- ============================================
-- TRIGGER: Actualizar votacion_completa
-- ============================================

-- Función que verifica si se alcanzó el quorum (2/3 votos)
CREATE OR REPLACE FUNCTION check_votacion_completa()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proyectos_votacion
  SET 
    votacion_completa = (
      SELECT COUNT(*) >= 2
      FROM votos
      WHERE proyecto_id = NEW.proyecto_id
    ),
    updated_at = NOW()
  WHERE id = NEW.proyecto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que ejecuta la función después de insertar un voto
CREATE TRIGGER after_voto_insert
AFTER INSERT ON votos
FOR EACH ROW
EXECUTE FUNCTION check_votacion_completa();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE comision_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos_votacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon (free tier)
CREATE POLICY "Allow all for anon" ON comision_usuarios FOR ALL TO anon USING (true);
CREATE POLICY "Allow all for anon" ON proyectos_votacion FOR ALL TO anon USING (true);
CREATE POLICY "Allow all for anon" ON votos FOR ALL TO anon USING (true);

-- ============================================
-- FUNCIÓN: Keep-Alive
-- ============================================

-- Función para mantener la base de datos activa
CREATE OR REPLACE FUNCTION ping_keepalive()
RETURNS TABLE(alive BOOLEAN, ping_time TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY SELECT true AS alive, NOW() AS ping_time;
END;
$$ LANGUAGE plpgsql;
\`\`\`

4. Click en **Run** (botón inferior derecho)
5. Verifica que el output muestre "Success. No rows returned"

---

## 3. Generar Hashes de Contraseñas

En tu terminal, dentro del proyecto:

\`\`\`bash
npm run hash-passwords
\`\`\`

Este comando generará los hashes bcrypt para los 3 usuarios. **Copia y guarda el output**, lo necesitarás en el siguiente paso.

---

## 4. Insertar Usuarios en la Base de Datos

1. En Supabase, ve a **SQL Editor** → "New Query"
2. Reemplaza los `<HASH_AQUI>` con los hashes que generaste:

\`\`\`sql
-- Usuarios votantes (pueden votar)
INSERT INTO comision_usuarios (username, password_hash, rol, activo) VALUES
('rodrigo', '<HASH_DE_RODRIGO>', 'votante', true),
('arturo', '<HASH_DE_ARTURO>', 'votante', true),
('carlos', '<HASH_DE_CARLOS>', 'votante', true);

-- Usuario observador (solo puede ver, no votar)
INSERT INTO comision_usuarios (username, password_hash, rol, activo) VALUES
('miguel', '<HASH_DE_MIGUEL>', 'observador', true);
\`\`\`

3. Click en **Run**

Para verificar que se insertaron correctamente:

\`\`\`sql
SELECT username, rol, activo, created_at FROM comision_usuarios;
\`\`\`

Deberías ver los 4 usuarios listados (3 votantes + 1 observador).

---

## 5. Obtener Credenciales de Supabase

1. En el panel lateral, ve a **Project Settings** (ícono de engranaje)
2. Click en **API**
3. Copia los siguientes valores:

   - **Project URL** (ejemplo: `https://abcdefghij.supabase.co`)
   - **anon / public key** (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

## 6. Configurar Variables de Entorno Locales

1. En la raíz del proyecto, crea el archivo `.env.local`:

\`\`\`bash
touch .env.local
\`\`\`

2. Agrega las credenciales de Supabase:

\`\`\`env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

**IMPORTANTE**: Este archivo está en `.gitignore` y NO debe subirse a GitHub.

---

## 7. Configurar Variables de Entorno en Vercel

Para producción, necesitas agregar las mismas variables en Vercel:

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Click en **Settings** → **Environment Variables**
3. Agrega las siguientes variables:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

4. Asegúrate de seleccionar **Production**, **Preview**, y **Development**
5. Click en **Save**

---

## 8. Configurar Keep-Alive en GitHub Actions

Para mantener Supabase activo (free tier pausa proyectos después de 7 días de inactividad):

1. En GitHub, ve a tu repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Agrega el siguiente secreto:

| Name | Value |
|------|-------|
| `VERCEL_DEPLOYMENT_URL` | `https://tu-proyecto.vercel.app` |

4. El workflow en `.github/workflows/supabase-keepalive.yml` ejecutará automáticamente cada 6 días
5. También puedes ejecutarlo manualmente desde **Actions** → **Supabase Keep-Alive** → **Run workflow**

---

## 9. Sincronización de Proyectos MDX a Supabase

### ✨ Sincronización Automática (Implementada)

El sistema **sincroniza automáticamente** los proyectos MDX a Supabase cada vez que:
- Alguien visita el dashboard `/comision-vigilancia`
- Alguien abre un proyecto individual

**Cómo funciona:**
1. Creas un nuevo archivo MDX en `src/content/proyectos-votacion/`
2. Haces commit y push a GitHub
3. Vercel hace deploy automáticamente
4. **La primera persona que visite el dashboard después del deploy** sincroniza automáticamente el nuevo proyecto
5. ¡Listo! El proyecto ya está disponible para votar

**Importante:**
- Solo **agrega** proyectos nuevos a la base de datos
- **NUNCA borra** proyectos de la BD (para preservar historial de votos)
- Si quieres archivar un proyecto, marca `activo: false` manualmente en Supabase
- La sincronización es silenciosa y no interrumpe la experiencia del usuario

### Método Manual (Opcional)

Si necesitas sincronizar manualmente (por ejemplo, para debugging):

**Localmente:**
Con el servidor de desarrollo corriendo (`npm run dev`):

1. Inicia sesión como usuario de la comisión o admin
2. Visita en tu navegador: `http://localhost:4321/api/admin/sync-proyectos`
3. Verás una respuesta JSON indicando cuántos proyectos se sincronizaron

**Usando curl**:
\`\`\`bash
# Con sesión de comisión
curl -b "comision_session=YOUR_SESSION" http://localhost:4321/api/admin/sync-proyectos

# O con sesión admin general
curl -b "ocaso_session=YOUR_SESSION" http://localhost:4321/api/admin/sync-proyectos
\`\`\`

**En producción**:
\`\`\`bash
curl -b "comision_session=YOUR_SESSION" https://tu-proyecto.vercel.app/api/admin/sync-proyectos
\`\`\`

---

## 10. Probar el Sistema

### Localmente:

\`\`\`bash
npm run dev
\`\`\`

Visita: `http://localhost:4321/comision-vigilancia/login`

### Usuarios de prueba:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| rodrigo | `R0dr1g0$Cv43!2026` | Votante |
| arturo | `Artur0*Cv43@2026` | Votante |
| carlos | `Carl0s#Cv43!2026` | Votante |
| miguel | `Migu3l&Cv43!2026` | Observador (solo lectura) |

**NOTA**: Cambia estas contraseñas en producción. Consulta `docs/USUARIOS-COMISION.md` (archivo gitignored).

---

## 11. Troubleshooting

### Error: "Faltan variables de entorno"
- Verifica que `.env.local` exista y tenga las variables correctas
- Reinicia el servidor de desarrollo después de crear `.env.local`

### Error: "No rows returned" al insertar usuarios
- Verifica que los hashes no tengan espacios al inicio/final
- Asegúrate de ejecutar `npm run hash-passwords` primero

### Los votos no se registran
- Verifica las policies de RLS en Supabase (SQL Editor):
  \`\`\`sql
  SELECT * FROM pg_policies WHERE tablename IN ('comision_usuarios', 'proyectos_votacion', 'votos');
  \`\`\`

### Keep-alive no funciona
- Verifica que el secreto `VERCEL_DEPLOYMENT_URL` esté configurado correctamente
- Prueba manualmente: `curl https://tu-proyecto.vercel.app/api/cron/keep-alive`

---

## Próximos Pasos

1. Crea proyectos MDX en `src/content/proyectos-votacion/`
2. Sincroniza con `npm run sync:proyectos`
3. Comparte las credenciales de acceso con los miembros de la comisión
4. ¡Comienza a votar!

---

## Notas de Seguridad

- **NUNCA** subas `.env.local` o `docs/USUARIOS-COMISION.md` a GitHub
- Cambia las contraseñas por defecto en producción
- Las RLS policies están configuradas de forma permisiva para el free tier
- Para mayor seguridad, considera actualizar a Supabase Pro y configurar RLS más estrictas
