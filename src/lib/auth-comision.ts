/**
 * Helpers de autenticación para Comisión de Vigilancia
 */

import bcrypt from 'bcryptjs';
import type { AstroCookies } from 'astro';
import { createSupabaseClient, type ComisionUsuario } from './supabase';

interface SessionData {
  userId: string;
  username: string;
  rol: 'votante' | 'observador';
}

const COOKIE_NAME = 'comision_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

/**
 * Login de usuario de comisión
 */
export async function loginComisionUser(
  username: string,
  password: string
): Promise<{ success: boolean; user?: ComisionUsuario; error?: string }> {
  const supabase = createSupabaseClient();

  // Buscar usuario por username
  const { data: user, error } = await supabase
    .from('comision_usuarios')
    .select('*')
    .eq('username', username)
    .eq('activo', true)
    .single();

  if (error || !user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  // Verificar contraseña
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return { success: false, error: 'Contraseña incorrecta' };
  }

  return { success: true, user };
}

/**
 * Crear sesión de comisión (cookie)
 */
export function createComisionSession(cookies: AstroCookies, user: ComisionUsuario) {
  const sessionData: SessionData = {
    userId: user.id,
    username: user.username,
    rol: user.rol,
  };

  cookies.set(COOKIE_NAME, JSON.stringify(sessionData), {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: import.meta.env.PROD, // HTTPS en producción
    sameSite: 'lax',
  });
}

/**
 * Obtener sesión de comisión desde cookie
 */
export function getComisionSession(cookies: AstroCookies): SessionData | null {
  const sessionCookie = cookies.get(COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;
    return sessionData;
  } catch {
    return null;
  }
}

/**
 * Validar sesión de comisión y obtener usuario
 */
export async function validateComisionSession(
  cookies: AstroCookies
): Promise<ComisionUsuario | null> {
  const session = getComisionSession(cookies);

  if (!session) {
    return null;
  }

  const supabase = createSupabaseClient();

  // Verificar que el usuario sigue activo
  const { data: user, error } = await supabase
    .from('comision_usuarios')
    .select('*')
    .eq('id', session.userId)
    .eq('activo', true)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Cerrar sesión de comisión
 */
export function logoutComisionUser(cookies: AstroCookies) {
  cookies.delete(COOKIE_NAME, { path: '/' });
}

/**
 * Verificar si hay sesión de comisión activa
 */
export function hasComisionSession(cookies: AstroCookies): boolean {
  return getComisionSession(cookies) !== null;
}
