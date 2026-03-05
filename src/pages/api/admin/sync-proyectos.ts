import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'
import { supabase } from '../../../lib/supabase'

/**
 * API endpoint para sincronizar proyectos MDX a Supabase
 * Solo accesible con autenticación de comisión o admin
 * 
 * GET /api/admin/sync-proyectos
 * 
 * Retorna:
 * - 200: { success: true, synced: number, errors: string[] }
 * - 401: No autorizado
 * - 500: Error del servidor
 */
export const GET: APIRoute = async ({ locals, cookies }) => {
  try {
    // Verificar autenticación (comisión o admin general)
    const comisionSession = cookies.get('comision_session')
    const adminSession = cookies.get('ocaso_session')
    
    if (!comisionSession && !adminSession) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Obtener todos los proyectos de la colección
    const proyectos = await getCollection('proyectos-votacion')
    
    const errors: string[] = []
    let syncedCount = 0

    // Sincronizar cada proyecto
    for (const proyecto of proyectos) {
      try {
        const { data, error } = await supabase
          .from('proyectos_votacion')
          .upsert({
            slug: proyecto.slug,
            titulo: proyecto.data.titulo,
            mes: proyecto.data.mes || null,
            anio: proyecto.data.anio || null,
            categoria: proyecto.data.categoria || null,
            presupuesto_estimado: proyecto.data.presupuesto_estimado || null,
            proveedor: proyecto.data.proveedor || null,
            activo: true, // Por defecto todos los proyectos están activos
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slug', // Actualizar si ya existe
            ignoreDuplicates: false
          })

        if (error) {
          errors.push(`Error en ${proyecto.slug}: ${error.message}`)
        } else {
          syncedCount++
        }
      } catch (err) {
        errors.push(`Excepción en ${proyecto.slug}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: proyectos.length,
      synced: syncedCount,
      errors: errors.length > 0 ? errors : undefined
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error en sync-proyectos:', error)
    return new Response(JSON.stringify({ 
      error: 'Error del servidor',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
