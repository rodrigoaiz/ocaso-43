/**
 * Script para sincronizar proyectos de MDX con Supabase
 * Ejecutar: npm run sync-proyectos
 * Se ejecuta automáticamente en cada build
 */

import { createClient } from '@supabase/supabase-js';
import { getCollection } from 'astro:content';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProyectos() {
  console.log('🔄 Sincronizando proyectos con Supabase...\n');
  
  try {
    // Cargar proyectos desde Content Collection
    const proyectos = await getCollection('proyectos-votacion');
    
    console.log(`📚 Encontrados ${proyectos.length} proyectos en MDX`);
    
    for (const proyecto of proyectos) {
      const { slug, data } = proyecto;
      
      // Upsert en Supabase
      const { error } = await supabase
        .from('proyectos_votacion')
        .upsert({
          slug: slug,
          titulo: data.titulo,
          mes: data.mes || null,
          anio: data.anio || null,
          categoria: data.categoria || null,
          presupuesto_estimado: data.presupuesto_estimado || null,
          proveedor: data.proveedor || null,
          activo: true,
        }, {
          onConflict: 'slug',
          ignoreDuplicates: false, // Actualizar si ya existe
        });
      
      if (error) {
        console.error(`❌ Error sincronizando "${slug}":`, error.message);
      } else {
        console.log(`✅ Sincronizado: ${slug}`);
      }
    }
    
    console.log('\n✨ Sincronización completada');
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    process.exit(1);
  }
}

syncProyectos();
