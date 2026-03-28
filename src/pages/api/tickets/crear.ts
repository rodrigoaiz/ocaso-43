import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Requiere sesión de residente
  const session = cookies.get('ocaso_session');
  if (!session || session.value !== 'active') {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Cuerpo inválido' }), { status: 400 });
  }

  const { titulo, descripcion, categoria, nombre, departamento } = body;

  // Validaciones
  if (!titulo?.trim())       return new Response(JSON.stringify({ error: 'El título es obligatorio' }), { status: 422 });
  if (!descripcion?.trim())  return new Response(JSON.stringify({ error: 'La descripción es obligatoria' }), { status: 422 });
  if (!categoria?.trim())    return new Response(JSON.stringify({ error: 'La categoría es obligatoria' }), { status: 422 });
  if (!nombre?.trim())       return new Response(JSON.stringify({ error: 'El nombre es obligatorio' }), { status: 422 });
  if (!departamento?.trim()) return new Response(JSON.stringify({ error: 'El departamento es obligatorio' }), { status: 422 });

  const categorias = ['reporte', 'solicitud', 'sugerencia'];
  if (!categorias.includes(categoria)) {
    return new Response(JSON.stringify({ error: 'Categoría inválida' }), { status: 422 });
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      titulo:      titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      nombre:      nombre.trim(),
      departamento: departamento.trim().toUpperCase(),
      estado:      'abierto',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[tickets/crear]', error);
    return new Response(JSON.stringify({ error: 'Error al guardar el ticket' }), { status: 500 });
  }

  return new Response(JSON.stringify({ id: data.id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
