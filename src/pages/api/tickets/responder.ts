import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { validateComisionSession } from '../../../lib/auth-comision';

export const POST: APIRoute = async ({ request, cookies }) => {
  // Requiere sesión de comisión
  const comisionUser = await validateComisionSession(cookies);
  if (!comisionUser) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo inválido' }), { status: 400 });
  }

  const { id, respuesta } = body;

  if (!id?.trim())        return new Response(JSON.stringify({ error: 'ID del ticket requerido' }), { status: 422 });
  if (!respuesta?.trim()) return new Response(JSON.stringify({ error: 'La respuesta no puede estar vacía' }), { status: 422 });

  const { error } = await supabase
    .from('tickets')
    .update({
      respuesta:       respuesta.trim(),
      respondido_at:   new Date().toISOString(),
      respondido_por:  comisionUser.username,
      estado:          'resuelto',
    })
    .eq('id', id);

  if (error) {
    console.error('[tickets/responder]', error);
    return new Response(JSON.stringify({ error: 'Error al guardar la respuesta' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
