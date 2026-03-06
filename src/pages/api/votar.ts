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
    const { proyectoSlug, voto, opcionProductoId } = body;

    // Validate input básico
    if (!proyectoSlug) {
      return new Response(JSON.stringify({ error: 'Datos incompletos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get project with tipo_votacion
    const { data: proyecto, error: proyectoError } = await supabase
      .from('proyectos_votacion')
      .select('id, tipo_votacion')
      .eq('slug', proyectoSlug)
      .eq('activo', true)
      .single();

    if (proyectoError || !proyecto) {
      return new Response(JSON.stringify({ error: 'Proyecto no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar según tipo de votación
    if (proyecto.tipo_votacion === 'binaria') {
      // Votación binaria: requiere voto (a_favor o en_contra)
      if (!voto || !['a_favor', 'en_contra'].includes(voto)) {
        return new Response(JSON.stringify({ error: 'Voto binario inválido' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (proyecto.tipo_votacion === 'seleccion') {
      // Votación de selección: requiere opcionProductoId
      if (!opcionProductoId) {
        return new Response(JSON.stringify({ error: 'Opción de producto requerida' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Validar que la opción existe y pertenece al proyecto
      const { data: opcion, error: opcionError } = await supabase
        .from('opciones_producto')
        .select('id')
        .eq('id', opcionProductoId)
        .eq('proyecto_id', proyecto.id)
        .single();
      
      if (opcionError || !opcion) {
        return new Response(JSON.stringify({ error: 'Opción no válida para este proyecto' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
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

    // Preparar datos del voto según tipo
    const votoData: any = {
      proyecto_id: proyecto.id,
      usuario_id: user.id,
    };

    if (proyecto.tipo_votacion === 'binaria') {
      votoData.voto = voto;
      votoData.opcion_producto_id = null;
    } else if (proyecto.tipo_votacion === 'seleccion') {
      votoData.voto = null;
      votoData.opcion_producto_id = opcionProductoId;
    }

    // Insert vote
    const { error: votoError } = await supabase
      .from('votos')
      .insert(votoData);

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
