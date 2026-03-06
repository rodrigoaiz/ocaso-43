/**
 * Cliente Supabase para Astro SSR
 */

import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

// Variables de entorno
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno: SUPABASE_URL o SUPABASE_ANON_KEY');
}

/**
 * Cliente Supabase para uso en el servidor (instancia global)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Función para crear un nuevo cliente Supabase si es necesario
 */
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Cliente Supabase con manejo de cookies para SSR
 */
export function createSupabaseServerClient(cookies: AstroCookies) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// Types para TypeScript
export interface ComisionUsuario {
  id: string;
  username: string;
  rol: 'votante' | 'observador';
  activo: boolean;
  created_at: string;
}

export interface ProyectoVotacion {
  id: string;
  slug: string;
  titulo: string;
  mes: number | null;
  anio: number | null;
  categoria: string | null;
  presupuesto_estimado: number | null;
  proveedor: string | null;
  votacion_completa: boolean;
  activo: boolean;
  created_at: string;
}

export interface Voto {
  id: string;
  proyecto_id: string;
  usuario_id: string;
  voto: 'a_favor' | 'en_contra';
  created_at: string;
}

export interface VotoConUsuario extends Voto {
  usuario: {
    username: string;
  };
}
