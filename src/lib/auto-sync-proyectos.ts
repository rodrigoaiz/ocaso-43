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

interface OpcionVotacion {
  id: string;
  nombre: string;
  precio?: number;
  descripcion_corta?: string;
}

/**
 * Sincroniza las opciones de producto de un proyecto de votación tipo selección
 */
async function syncOpcionesProducto(proyectoId: string, opciones: OpcionVotacion[]): Promise<void> {
  try {
    // Obtener opciones actuales de BD
    const { data: opcionesActuales } = await supabase
      .from('opciones_producto')
      .select('*')
      .eq('proyecto_id', proyectoId);
    
    const opcionesActualesMap = new Map(
      opcionesActuales?.map(o => [o.opcion_id, o]) || []
    );
    
    // Insertar/actualizar opciones del MDX
    for (const [index, opcion] of opciones.entries()) {
      const opcionExistente = opcionesActualesMap.get(opcion.id);
      
      if (opcionExistente) {
        // Actualizar opción existente
        await supabase
          .from('opciones_producto')
          .update({
            nombre: opcion.nombre,
            precio: opcion.precio || null,
            descripcion_corta: opcion.descripcion_corta || null,
            orden: index + 1,
          })
          .eq('id', opcionExistente.id);
      } else {
        // Insertar nueva opción
        await supabase
          .from('opciones_producto')
          .insert({
            proyecto_id: proyectoId,
            opcion_id: opcion.id,
            nombre: opcion.nombre,
            precio: opcion.precio || null,
            descripcion_corta: opcion.descripcion_corta || null,
            orden: index + 1,
          });
      }
      
      // Marcar como procesada
      opcionesActualesMap.delete(opcion.id);
    }
    
    // Eliminar opciones que ya no están en MDX
    if (opcionesActualesMap.size > 0) {
      const idsEliminar = Array.from(opcionesActualesMap.values()).map(o => o.id);
      await supabase
        .from('opciones_producto')
        .delete()
        .in('id', idsEliminar);
    }
  } catch (error) {
    console.error('[AutoSync] Error sincronizando opciones:', error);
    throw error;
  }
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
        const { data: proyectoUpserted, error } = await supabase
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
            tipo_votacion: proyecto.data.tipo_votacion || 'binaria', // NUEVO: tipo de votación
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'slug',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (error) {
          errors.push(`Error en ${proyecto.slug}: ${error.message}`);
        } else {
          // Solo contar como "sincronizado" si es un proyecto nuevo
          if (!slugsExistentes.has(proyecto.slug)) {
            syncedCount++;
          }
          
          // NUEVO: Si es votación de selección, sincronizar opciones
          if (proyectoUpserted && proyecto.data.tipo_votacion === 'seleccion' && proyecto.data.opciones_votacion) {
            await syncOpcionesProducto(proyectoUpserted.id, proyecto.data.opciones_votacion);
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
