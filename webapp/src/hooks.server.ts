import type { Handle } from '@sveltejs/kit';

const csp = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
	"style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
	"font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com data:",
	"img-src 'self' data: https:",
	"connect-src 'self'",
	"object-src 'none'",
	"base-uri 'none'",
	"frame-ancestors 'none'",
	"form-action 'none'",
	'upgrade-insecure-requests'
].join('; ');

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('Content-Security-Policy', csp);
	response.headers.set('Referrer-Policy', 'no-referrer');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), payment=()'
	);

	return response;
};
