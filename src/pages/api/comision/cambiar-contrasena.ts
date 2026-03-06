import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { createSupabaseClient } from '../../../lib/supabase';
import { validateComisionSession } from '../../../lib/auth-comision';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar sesión activa
    const user = await validateComisionSession(cookies);
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'No autenticado' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Obtener datos del request
    const body = await request.json();
    const { contrasenaActual, contrasenaNueva, confirmarContrasena } = body;

    // 3. Validar inputs
    if (!contrasenaActual || !contrasenaNueva || !confirmarContrasena) {
      return new Response(JSON.stringify({ 
        error: 'Todos los campos son obligatorios' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (contrasenaNueva !== confirmarContrasena) {
      return new Response(JSON.stringify({ 
        error: 'Las contraseñas nuevas no coinciden' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (contrasenaNueva.length < 8) {
      return new Response(JSON.stringify({ 
        error: 'La contraseña debe tener al menos 8 caracteres' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Obtener usuario actual de la base de datos
    const supabase = createSupabaseClient();
    const { data: userData, error: fetchError } = await supabase
      .from('comision_usuarios')
      .select('id, password_hash')
      .eq('username', user.username)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching user:', fetchError);
      return new Response(JSON.stringify({ 
        error: 'Usuario no encontrado' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(contrasenaActual, userData.password_hash);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ 
        error: 'La contraseña actual es incorrecta' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(contrasenaNueva, 10);

    // 7. Actualizar en la base de datos
    const { error: updateError } = await supabase
      .from('comision_usuarios')
      .update({ password_hash: newPasswordHash })
      .eq('id', userData.id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(JSON.stringify({ 
        error: 'Error al actualizar la contraseña' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 8. Retornar éxito
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Contraseña actualizada exitosamente' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in cambiar-contrasena:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
