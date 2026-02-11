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

export const collections = {
  minutas: minutas,
  documentos: documentos,
};
