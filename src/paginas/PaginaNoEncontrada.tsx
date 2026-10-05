import { useEffect } from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PaginaNoEncontrada() {
    useEffect(() => {
        const tituloAnterior = document.title;
        document.title = 'Página no encontrada · SuColor';
        return () => { document.title = tituloAnterior; };
    }, []);

    return (
        <main className="relative isolate flex min-h-screen min-h-[100svh] flex-col overflow-hidden bg-[#FFF8ED] text-[#171717]">
            <img src="/auto.png" alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_bottom] lg:object-right" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,248,237,0.98)_0%,rgba(255,248,237,0.93)_58%,rgba(255,248,237,0.2)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,248,237,0.99)_0%,rgba(255,248,237,0.95)_35%,rgba(255,248,237,0.15)_80%)]" />

            <header className="px-6 py-6 sm:px-12 lg:px-20">
                <Link to="/" aria-label="SuColor, ir al inicio" className="inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C94E0C]">
                    <img src="/logo.png" alt="SuColor" className="h-14 w-auto" />
                </Link>
            </header>

            <div className="mx-auto flex w-full max-w-[1440px] flex-1 items-center px-6 pb-40 pt-6 sm:px-12 lg:px-20 lg:pb-16">
                <div className="max-w-[540px]">
                    <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8D451D]">
                        <span aria-hidden="true" className="h-px w-9 bg-[#C94E0C]" />
                        Un desvío inesperado
                    </p>
                    <p aria-hidden="true" className="mt-3 text-[clamp(7rem,18vw,13rem)] font-black leading-none tracking-[-0.07em] text-[#C94E0C]">404<span className="text-[#171717]">.</span></p>
                    <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                        Esta ruta<br />salió del mapa.
                    </h1>
                    <p className="mt-5 max-w-[390px] text-base leading-7 text-neutral-600">
                        La página que buscas no existe o cambió de dirección. Volvamos al inicio para retomar el camino.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link to="/" className="inline-flex min-h-12 items-center justify-center gap-4 rounded-xl bg-[#C94E0C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#A33D08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C94E0C]">
                            Volver al inicio <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                        <a href="https://wa.me/593989575378" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-[#8D451D]/20 bg-[#FFF8ED]/90 px-5 py-3 text-sm font-semibold transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C94E0C]">
                            <MessageCircle aria-hidden="true" className="h-4 w-4" /> Contactar al taller
                        </a>
                    </div>
                    <p className="mt-5 text-xs leading-5 text-neutral-600">¿Buscas tu vehículo? Puedes consultar su estado con tu placa desde el inicio.</p>
                </div>
            </div>
            <footer className="px-6 py-5 text-xs font-medium text-[#64391F] sm:px-12 lg:px-20">SuColor · Pintura y latonería en Loja</footer>
        </main>
    );
}
