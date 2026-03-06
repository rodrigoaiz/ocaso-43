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
    proveedor: z.string().optional(),
    descripcion_corta: z.string().optional(),
    votacion_abierta: z.boolean().default(true), // Si false, la votación está cerrada
    
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

export const collections = {
  minutas: minutas,
  documentos: documentos,
  "proyectos-votacion": proyectosVotacion,
};
