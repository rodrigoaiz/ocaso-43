import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { validateComisionSession } from '../../../lib/auth-comision';
import type { TicketEstado } from '../../../lib/supabase';

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

  const { id, estado } = body;

  if (!id?.trim()) return new Response(JSON.stringify({ error: 'ID del ticket requerido' }), { status: 422 });

  const estadosValidos: TicketEstado[] = ['abierto', 'en_proceso', 'resuelto'];
  if (!estadosValidos.includes(estado as TicketEstado)) {
    return new Response(JSON.stringify({ error: 'Estado inválido' }), { status: 422 });
  }

  const updateData: Record<string, unknown> = { estado };

  // Si cambia a resuelto y no tenía respondido_at, marcar timestamp
  if (estado === 'resuelto') {
    const { data: ticket } = await supabase
      .from('tickets')
      .select('respondido_at')
      .eq('id', id)
      .single();
    
    if (!ticket?.respondido_at) {
      updateData.respondido_at  = new Date().toISOString();
      updateData.respondido_por = comisionUser.username;
    }
  }

  const { error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('[tickets/estado]', error);
    return new Response(JSON.stringify({ error: 'Error al actualizar el estado' }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
