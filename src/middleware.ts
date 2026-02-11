import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, redirect } = context;

	// Rutas públicas y recursos estáticos
	const publicPaths = ['/login', '/_astro', '/favicon.svg', '/api/'];
	const isPublic = publicPaths.some(path => url.pathname.startsWith(path));
	
	// Permitir archivos con extensión común (imágenes, fuentes, etc)
	const isAsset = /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf)$/.test(url.pathname);

	if (isPublic || isAsset) {
		return next();
	}

	const session = cookies.get('ocaso_session');

	if (!session || session.value !== 'active') {
		const reason = !session ? 'no_cookie' : 'invalid_session';
		return redirect(`/login?reason=${reason}`);
	}

	return next();
});


