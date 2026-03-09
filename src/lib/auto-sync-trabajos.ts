/**
 * Utilidad para sincronización automática de trabajos realizados MDX a Supabase
 * 
 * Similar a auto-sync-proyectos.ts, esta función sincroniza trabajos realizados
 * desde archivos MDX a la base de datos.
 */

import { getCollection } from 'astro:content';
import { supabase } from './supabase';

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

interface ImagenTrabajo {
  url: string;
  tipo: 'antes' | 'durante' | 'despues';
  descripcion?: string;
}

/**
 * Sincroniza las imágenes de un trabajo realizado
 */
async function syncImagenesTrabajo(trabajoId: string, imagenes: ImagenTrabajo[]): Promise<void> {
  try {
    // Obtener imágenes actuales de BD
    const { data: imagenesActuales } = await supabase
      .from('trabajo_imagenes')
      .select('*')
      .eq('trabajo_id', trabajoId);
    
    const imagenesActualesMap = new Map(
      imagenesActuales?.map(img => [img.url, img]) || []
    );
    
    // Insertar/actualizar imágenes del MDX
    for (const [index, imagen] of imagenes.entries()) {
      const imagenExistente = imagenesActualesMap.get(imagen.url);
      
      if (imagenExistente) {
        // Actualizar imagen existente
        await supabase
          .from('trabajo_imagenes')
          .update({
            tipo: imagen.tipo,
            descripcion: imagen.descripcion || null,
            orden: index + 1,
          })
          .eq('id', imagenExistente.id);
      } else {
        // Insertar nueva imagen
        await supabase
          .from('trabajo_imagenes')
          .insert({
            trabajo_id: trabajoId,
            url: imagen.url,
            tipo: imagen.tipo,
            descripcion: imagen.descripcion || null,
            orden: index + 1,
          });
      }
      
      // Marcar como procesada
      imagenesActualesMap.delete(imagen.url);
    }
    
    // Eliminar imágenes que ya no están en MDX
    if (imagenesActualesMap.size > 0) {
      const idsEliminar = Array.from(imagenesActualesMap.values()).map(img => img.id);
      await supabase
        .from('trabajo_imagenes')
        .delete()
        .in('id', idsEliminar);
    }
  } catch (error) {
    console.error('[AutoSync] Error sincronizando imágenes:', error);
    throw error;
  }
}

/**
 * Sincroniza trabajos realizados MDX a Supabase
 * - Solo agrega trabajos que no existen en BD
 * - Actualiza trabajos existentes con datos del MDX
 * - NUNCA borra trabajos de la BD (para preservar historial)
 */
export async function autoSyncTrabajos(): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedCount = 0;

  try {
    // Obtener todos los trabajos MDX
    const trabajosMDX = await getCollection('trabajos-realizados');

    // Obtener slugs existentes en BD
    const { data: trabajosExistentes } = await supabase
      .from('trabajos_realizados')
      .select('slug');

    const slugsExistentes = new Set(trabajosExistentes?.map((p) => p.slug) || []);

    // Sincronizar cada trabajo
    for (const trabajo of trabajosMDX) {
      try {
        const {
          titulo,
          fecha_realizacion,
          categoria,
          proyecto_slug,
          fecha_aprobacion_comision,
          costo_final,
          presupuesto_estimado,
          proveedor,
          contacto_proveedor,
          descripcion_corta,
          imagenes,
          notas,
          visible,
        } = trabajo.data;

        // Obtener ID del proyecto si existe proyecto_slug
        let proyectoId = null;
        if (proyecto_slug) {
          const { data: proyecto } = await supabase
            .from('proyectos_votacion')
            .select('id')
            .eq('slug', proyecto_slug)
            .single();
          proyectoId = proyecto?.id || null;
        }

        const trabajoData = {
          slug: trabajo.slug,
          titulo,
          fecha_realizacion: fecha_realizacion.toISOString().split('T')[0],
          categoria,
          proyecto_id: proyectoId,
          fecha_aprobacion_comision: fecha_aprobacion_comision
            ? fecha_aprobacion_comision.toISOString().split('T')[0]
            : null,
          costo_final,
          presupuesto_estimado: presupuesto_estimado || null,
          proveedor,
          contacto_proveedor: contacto_proveedor || null,
          descripcion: descripcion_corta,
          contenido: trabajo.body || null,
          notas: notas || null,
          visible: visible !== false,
        };

        if (slugsExistentes.has(trabajo.slug)) {
          // Actualizar trabajo existente
          const { data: trabajoActualizado, error } = await supabase
            .from('trabajos_realizados')
            .update(trabajoData)
            .eq('slug', trabajo.slug)
            .select('id')
            .single();

          if (error) throw error;

          // Sincronizar imágenes
          if (trabajoActualizado && imagenes && imagenes.length > 0) {
            await syncImagenesTrabajo(trabajoActualizado.id, imagenes);
          }
        } else {
          // Insertar nuevo trabajo
          const { data: nuevoTrabajo, error } = await supabase
            .from('trabajos_realizados')
            .insert(trabajoData)
            .select('id')
            .single();

          if (error) throw error;

          // Sincronizar imágenes
          if (nuevoTrabajo && imagenes && imagenes.length > 0) {
            await syncImagenesTrabajo(nuevoTrabajo.id, imagenes);
          }

          syncedCount++;
        }
      } catch (error) {
        const errorMsg = `Error sincronizando trabajo ${trabajo.slug}: ${error}`;
        console.error('[AutoSync]', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`[AutoSync] Trabajos sincronizados: ${syncedCount}`);

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors,
    };
  } catch (error) {
    console.error('[AutoSync] Error general:', error);
    return {
      success: false,
      synced: syncedCount,
      errors: [String(error)],
    };
  }
}

/**
 * Versión silenciosa para ejecutar en páginas sin mostrar errores
 */
export async function autoSyncTrabajosSilent(): Promise<void> {
  try {
    await autoSyncTrabajos();
  } catch (error) {
    // Silenciar errores en producción
    if (import.meta.env.DEV) {
      console.error('[AutoSync] Error:', error);
    }
  }
}
