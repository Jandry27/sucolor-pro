const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();

type ValorAnalytics = string | number | boolean;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        va?: (...args: unknown[]) => void;
    }
}

let iniciado = false;

function sanitizarUrl(urlOriginal: string) {
    try {
        const url = new URL(urlOriginal);
        url.searchParams.delete('token');

        if (url.hash.includes('?')) {
            const [rutaHash, queryHash = ''] = url.hash.split('?');
            const paramsHash = new URLSearchParams(queryHash);
            paramsHash.delete('token');

            const queryLimpia = paramsHash.toString();
            url.hash = queryLimpia ? `${rutaHash}?${queryLimpia}` : rutaHash;
        }

        return url.toString();
    } catch {
        return urlOriginal.replace(/([?&]token=)[^&#]*/gi, '$1[redacted]');
    }
}

function rutaActual() {
    const urlLimpia = sanitizarUrl(window.location.href);

    try {
        const url = new URL(urlLimpia);
        return `${url.pathname}${url.search}${url.hash}`;
    } catch {
        return window.location.pathname;
    }
}

function enviarVistaPagina() {
    if (!measurementId || !window.gtag) return;

    window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: sanitizarUrl(window.location.href),
        page_path: rutaActual(),
    });
}

export function iniciarGoogleAnalytics() {
    if (
        iniciado ||
        !measurementId ||
        !/^G-[A-Z0-9]+$/i.test(measurementId) ||
        typeof window === 'undefined'
    ) {
        return;
    }

    iniciado = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args: unknown[]) => {
        window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
        send_page_view: false,
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    enviarVistaPagina();
    window.addEventListener('hashchange', enviarVistaPagina);
}

export function registrarEventoAnalytics(
    nombre: string,
    parametros: Record<string, ValorAnalytics> = {}
) {
    if (measurementId && window.gtag) {
        window.gtag('event', nombre, parametros);
    }

    window.va?.('event', {
        name: nombre,
        data: parametros,
    });
}
