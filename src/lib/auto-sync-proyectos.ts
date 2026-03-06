/**
 * Utilidad para sincronización automática de proyectos MDX a Supabase
 * 
 * Esta función se ejecuta automáticamente cuando se carga el dashboard o una página de proyecto.
 * Solo AGREGA proyectos nuevos, NUNCA borra de la base de datos para preservar historial de votos.
 */

import { getCollection } from 'astro:content';
import { supabase } from './supabase';

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

/**
 * Sincroniza proyectos MDX a Supabase
 * - Solo agrega proyectos que no existen en BD
 * - Actualiza proyectos existentes con datos del MDX
 * - NUNCA borra proyectos de la BD (para preservar votos)
 */
export async function autoSyncProyectos(): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // Obtener todos los proyectos MDX
    const proyectosMDX = await getCollection('proyectos-votacion');

    // Obtener slugs existentes en BD
    const { data: proyectosExistentes } = await supabase
      .from('proyectos_votacion')
      .select('slug');

    const slugsExistentes = new Set(proyectosExistentes?.map(p => p.slug) || []);

    // Sincronizar cada proyecto
    for (const proyecto of proyectosMDX) {
      try {
        // Si el proyecto ya existe en BD, actualizarlo
        // Si no existe, insertarlo
        const { error } = await supabase
          .from('proyectos_votacion')
          .upsert({
            slug: proyecto.slug,
            titulo: proyecto.data.titulo,
            mes: proyecto.data.mes || null,
            anio: proyecto.data.anio || null,
            categoria: proyecto.data.categoria || null,
            presupuesto_estimado: proyecto.data.presupuesto_estimado || null,
            proveedor: proyecto.data.proveedor || null,
            activo: proyecto.data.votacion_abierta ?? true, // Mapear votacion_abierta a activo
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false
          });

        if (error) {
          errors.push(`Error en ${proyecto.slug}: ${error.message}`);
        } else {
          // Solo contar como "sincronizado" si es un proyecto nuevo
          if (!slugsExistentes.has(proyecto.slug)) {
            syncedCount++;
          }
        }
      } catch (err) {
        errors.push(`Excepción en ${proyecto.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors
    };

  } catch (error) {
    return {
      success: false,
      synced: 0,
      errors: [`Error general: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}

/**
 * Versión silenciosa de autoSyncProyectos que no arroja errores
 * Útil para llamar en páginas sin interrumpir la carga
 */
export async function autoSyncProyectosSilent(): Promise<void> {
  try {
    await autoSyncProyectos();
    // Sincronización exitosa o con errores, pero no interrumpe el flujo
  } catch (error) {
    // Silenciosamente capturar cualquier error
    console.error('[AutoSync] Error silencioso:', error);
  }
}
