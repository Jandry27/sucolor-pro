import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App';
import { iniciarGoogleAnalytics } from './biblioteca/googleAnalytics';
import { resolverRutaAnterior } from './biblioteca/rutas';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const rutaAnterior = resolverRutaAnterior(window.location.href);
if (rutaAnterior) window.history.replaceState(window.history.state, '', rutaAnterior);
window.addEventListener('hashchange', () => {
    const destino = resolverRutaAnterior(window.location.href);
    if (destino) window.location.replace(destino);
});

iniciarGoogleAnalytics();

createRoot(rootElement).render(
    <StrictMode>
        <App />
        <SpeedInsights />
    </StrictMode>
);
