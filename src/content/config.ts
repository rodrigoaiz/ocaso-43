import { defineCollection, z } from "astro:content";

const minutas = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string().optional(),
    year: z.number(),
    month: z.number(), // 1-12
    tags: z.array(z.string()).default([]),
  }),
});

const documentos = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.string(),
    description: z.string().optional(),
  }),
});

const proyectosVotacion = defineCollection({
  type: "content",
  schema: z.object({
    titulo: z.string(),
    fecha: z.date(),
    mes: z.number().min(1).max(12).optional(),
    anio: z.number().optional(),
    categoria: z.string().optional(),
    presupuesto_estimado: z.number().optional(),
    presupuesto_min: z.number().optional(),
    presupuesto_max: z.number().optional(),
    proveedor: z.string().optional(),
    descripcion_corta: z.string().optional(),
    votacion_abierta: z.boolean().default(true), // Si false, la votación está cerrada
    visible_publico: z.boolean().default(false), // Si true, se muestra en la homepage a todos los residentes
    
    // NUEVO: Tipo de votación
    tipo_votacion: z.enum(['binaria', 'seleccion']).default('binaria'),
    
    // NUEVO: Opciones para votación de selección
    opciones_votacion: z.array(
      z.object({
        id: z.string(),
        nombre: z.string(),
        precio: z.number().optional(),
        descripcion_corta: z.string().optional(),
      })
    ).optional(),
  }).refine(
    (data) => {
      // Si es selección, opciones_votacion es requerido (min 2, max 6)
      if (data.tipo_votacion === 'seleccion') {
        return data.opciones_votacion && 
               data.opciones_votacion.length >= 2 && 
               data.opciones_votacion.length <= 6;
      }
      return true;
    },
    {
      message: "Votación de selección requiere entre 2 y 6 opciones",
    }
  ),
});

const trabajosRealizados = defineCollection({
  type: "content",
  schema: z.object({
    titulo: z.string(),
    fecha_realizacion: z.date(),
    categoria: z.enum(['Mantenimiento', 'Compras', 'Mejoras', 'Emergencias', 'Reparaciones']),
    
    // Optional link to approved project
    proyecto_slug: z.string().optional(),
    fecha_aprobacion_comision: z.date().optional(),
    
    // Costs
    costo_final: z.number(),
    presupuesto_estimado: z.number().optional(),
    
    // Provider
    proveedor: z.string(),
    contacto_proveedor: z.string().optional(),
    
    // Short description for card display
    descripcion_corta: z.string(),
    
    // Images (stored in /public/img/trabajos/)
    imagenes: z.array(
      z.object({
        url: z.string(),
        tipo: z.enum(['antes', 'durante', 'despues']),
        descripcion: z.string().optional(),
      })
    ).default([]),
    
    // Optional documents
    documentos: z.array(
      z.object({
        nombre: z.string(),
        url: z.string(),
        tipo: z.enum(['factura', 'contrato', 'garantia', 'cotizacion', 'otro']),
      })
    ).default([]),
    
    // Additional notes
    notas: z.string().optional(),
    
    // Visibility
    visible: z.boolean().default(true),
  }),
});

const convocatorias = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    assemblyDate: z.date(),
    assemblyType: z.enum(["ordinaria", "extraordinaria"]),
    location: z.string(),
    firstCallTime: z.string(),   // "19:00"
    secondCallTime: z.string(),  // "19:30"
    thirdCallTime: z.string(),   // "20:00"
    active: z.boolean().default(true),
    publishedAt: z.date(),
    pdfUrl: z.string().optional(),
    administrator: z.string().optional(),
  }),
});

export const collections = {
  minutas: minutas,
  documentos: documentos,
  "proyectos-votacion": proyectosVotacion,
  "trabajos-realizados": trabajosRealizados,
  convocatorias: convocatorias,
};
