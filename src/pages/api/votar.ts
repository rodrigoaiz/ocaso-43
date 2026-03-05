import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { validateComisionSession } from '../../lib/auth-comision';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate session
    const user = await validateComisionSession(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { proyectoSlug, voto } = body;

    // Validate input
    if (!proyectoSlug || !voto) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (voto !== 'a_favor' && voto !== 'en_contra') {
      return new Response(JSON.stringify({ error: 'Voto inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get project ID from slug
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyectos_votacion')
      .select('id')
      .eq('slug', proyectoSlug)
      .eq('activo', true)
      .single();

    if (proyectoError || !proyecto) {
      return new Response(JSON.stringify({ error: 'Proyecto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('votos')
      .select('id')
      .eq('proyecto_id', proyecto.id)
      .eq('usuario_id', user.id)
      .single();

    if (existingVote) {
      return new Response(JSON.stringify({ error: 'Ya has votado en este proyecto' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert vote
    const { error: votoError } = await supabase
      .from('votos')
      .insert({
        proyecto_id: proyecto.id,
        usuario_id: user.id,
        voto: voto
      });

    if (votoError) {
      console.error('Error al registrar voto:', votoError);
      return new Response(JSON.stringify({ error: 'Error al registrar voto' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Voto registrado correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en API votar:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
