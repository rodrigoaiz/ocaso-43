# TODO: Security - Row Level Security (RLS)

## 🔐 Pending: Enable RLS on Supabase Tables

**Priority:** Medium  
**Status:** Pending  
**Issue:** Supabase logs show tables are public but RLS is not enabled

### Tables that need RLS:

1. ✅ `trabajos_realizados` - **READ PUBLIC** (completed work should be visible)
2. ✅ `trabajo_imagenes` - **READ PUBLIC** (images should be visible)
3. ✅ `trabajo_documentos` - **READ PUBLIC** (documents should be visible)
4. 🔒 `proyectos_votacion` - **READ PUBLIC** (projects visible, but not vote details)
5. 🔒 `votos` - **NO PUBLIC ACCESS** (votes are private)
6. 🔒 `comision_usuarios` - **NO PUBLIC ACCESS** (user data is private)
7. 🔒 `opciones_producto` - **NO PUBLIC ACCESS** (voting options private)

### Current Risk Level: **MEDIUM**

**Why not critical:**
- Portal uses SSR (server-side rendering)
- Queries run from server, not client
- Authentication handled with cookies/sessions
- `SUPABASE_ANON_KEY` is not exposed to client-side code

**Why it matters:**
- If someone obtains `SUPABASE_ANON_KEY`, they could access API directly
- Best practice is defense in depth

---

## 📝 SQL Migration to Enable RLS

Create file: `docs/migrations/004-enable-rls.sql`

```sql
-- ================================================
-- Migration 004: Enable Row Level Security (RLS)
-- ================================================
-- Description: Enable RLS on all tables and set appropriate policies
-- Date: TBD
-- Author: System

-- ======================
-- 1. TRABAJOS REALIZADOS
-- ======================

-- Enable RLS on trabajos_realizados
ALTER TABLE trabajos_realizados ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (completed work is public)
CREATE POLICY "Public read access for trabajos_realizados"
ON trabajos_realizados FOR SELECT
USING (visible = true);

-- Policy: No public write access (only server can write)
-- Server uses service_role key, which bypasses RLS


-- ======================
-- 2. TRABAJO IMAGENES
-- ======================

-- Enable RLS on trabajo_imagenes
ALTER TABLE trabajo_imagenes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (images are public)
CREATE POLICY "Public read access for trabajo_imagenes"
ON trabajo_imagenes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trabajos_realizados
    WHERE trabajos_realizados.id = trabajo_imagenes.trabajo_id
    AND trabajos_realizados.visible = true
  )
);


-- ======================
-- 3. TRABAJO DOCUMENTOS
-- ======================

-- Enable RLS on trabajo_documentos
ALTER TABLE trabajo_documentos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (documents are public)
CREATE POLICY "Public read access for trabajo_documentos"
ON trabajo_documentos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM trabajos_realizados
    WHERE trabajos_realizados.id = trabajo_documentos.trabajo_id
    AND trabajos_realizados.visible = true
  )
);


-- ======================
-- 4. PROYECTOS VOTACION
-- ======================

-- Enable RLS on proyectos_votacion
ALTER TABLE proyectos_votacion ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (projects are public, but not vote counts)
CREATE POLICY "Public read access for proyectos_votacion"
ON proyectos_votacion FOR SELECT
USING (true);


-- ======================
-- 5. VOTOS (PRIVATE)
-- ======================

-- Enable RLS on votos
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- Policy: No public access (votes are private)
-- Only authenticated comision users can read their own votes
CREATE POLICY "Users can read their own votes"
ON votos FOR SELECT
USING (false); -- Disable all public access, server handles with service_role


-- ======================
-- 6. COMISION USUARIOS (PRIVATE)
-- ======================

-- Enable RLS on comision_usuarios
ALTER TABLE comision_usuarios ENABLE ROW LEVEL SECURITY;

-- Policy: No public access (user data is private)
CREATE POLICY "No public access to comision_usuarios"
ON comision_usuarios FOR SELECT
USING (false); -- Disable all public access, server handles with service_role


-- ======================
-- 7. OPCIONES PRODUCTO (PRIVATE)
-- ======================

-- Enable RLS on opciones_producto
ALTER TABLE opciones_producto ENABLE ROW LEVEL SECURITY;

-- Policy: No public access (voting options are private)
CREATE POLICY "No public access to opciones_producto"
ON opciones_producto FOR SELECT
USING (false); -- Disable all public access, server handles with service_role


-- ======================
-- VERIFICATION
-- ======================

-- Check that RLS is enabled on all tables:
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'trabajos_realizados',
  'trabajo_imagenes', 
  'trabajo_documentos',
  'proyectos_votacion',
  'votos',
  'comision_usuarios',
  'opciones_producto'
)
ORDER BY tablename;


-- ======================
-- ROLLBACK (if needed)
-- ======================

/*
-- Disable RLS on all tables
ALTER TABLE trabajos_realizados DISABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_imagenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE trabajo_documentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos_votacion DISABLE ROW LEVEL SECURITY;
ALTER TABLE votos DISABLE ROW LEVEL SECURITY;
ALTER TABLE comision_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE opciones_producto DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Public read access for trabajos_realizados" ON trabajos_realizados;
DROP POLICY IF EXISTS "Public read access for trabajo_imagenes" ON trabajo_imagenes;
DROP POLICY IF EXISTS "Public read access for trabajo_documentos" ON trabajo_documentos;
DROP POLICY IF EXISTS "Public read access for proyectos_votacion" ON proyectos_votacion;
DROP POLICY IF EXISTS "Users can read their own votes" ON votos;
DROP POLICY IF EXISTS "No public access to comision_usuarios" ON comision_usuarios;
DROP POLICY IF EXISTS "No public access to opciones_producto" ON opciones_producto;
*/
```

---

## 🚀 How to Apply (When Ready):

1. Open Supabase Dashboard → SQL Editor
2. Copy the SQL from the migration file above
3. Execute the SQL
4. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
5. Test that:
   - ✅ Public pages can read trabajos_realizados
   - ✅ Public pages can read trabajo_imagenes  
   - ❌ Public API cannot read votos directly
   - ❌ Public API cannot read comision_usuarios

---

## 📚 Additional Resources:

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Note:** Server-side code using `service_role` key bypasses RLS, so all current functionality will continue to work after enabling RLS.
