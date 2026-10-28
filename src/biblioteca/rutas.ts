/** Conserva los enlaces compartidos antes de pasar a rutas sin #. */
export function resolverRutaAnterior(href: string): string | null {
    const url = new URL(href);
    if (!url.hash.startsWith('#/') || url.hash.startsWith('#//')) return null;

    const destino = new URL(url.hash.slice(1), url.origin);
    if (destino.origin !== url.origin) return null;

    const ruta = destino.pathname === '/administracion/login' ? '/admin' : destino.pathname;
    return ruta + destino.search + destino.hash;
}

export function crearEnlaceSeguimiento(codigo: string, token: string): string {
    const url = new URL('/track/' + encodeURIComponent(codigo), window.location.origin);
    url.searchParams.set('token', token);
    return url.toString();
}
