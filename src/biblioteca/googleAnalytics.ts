const measurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim();

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

let iniciado = false;

function rutaActual() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function enviarVistaPagina() {
    if (!measurementId || !window.gtag) return;

    window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
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
    parametros: Record<string, string | number | boolean> = {}
) {
    if (!measurementId || !window.gtag) return;

    window.gtag('event', nombre, parametros);
}
