import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear the comision session cookie
  cookies.delete('comision_session', {
    path: '/',
  });

  // Redirect to login page
  return redirect('/comision-vigilancia/login', 302);
};
