import { defineMiddleware } from 'astro:middleware';
import { validateComisionSession } from './lib/auth-comision';

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, redirect, locals } = context;

	// Rutas públicas y recursos estáticos
	const publicPaths = ['/login', '/_astro', '/favicon.svg', '/api/'];
	const isPublic = publicPaths.some(path => url.pathname.startsWith(path));
	
	// Permitir archivos con extensión común (imágenes, fuentes, etc)
	const isAsset = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf)$/.test(url.pathname);

	if (isPublic || isAsset) {
		return next();
	}

	// Protección de rutas de Comisión de Vigilancia
	if (url.pathname.startsWith('/comision-vigilancia')) {
		// Permitir acceso a login de comisión
		if (url.pathname === '/comision-vigilancia/login') {
			return next();
		}

		// Validar sesión de comisión
		const comisionUser = await validateComisionSession(cookies);
		
		if (!comisionUser) {
			return redirect('/comision-vigilancia/login?reason=no_session');
		}

		// Agregar usuario al contexto para usarlo en las páginas
		locals.comisionUser = comisionUser;
		
		return next();
	}

	// Protección general del sitio (sistema existente)
	const session = cookies.get('ocaso_session');

	if (!session || session.value !== 'active') {
		const reason = !session ? 'no_cookie' : 'invalid_session';
		return redirect(`/login?reason=${reason}`);
	}

	return next();
});


