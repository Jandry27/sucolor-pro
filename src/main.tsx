import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App';
import { iniciarGoogleAnalytics } from './biblioteca/googleAnalytics';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

iniciarGoogleAnalytics();

createRoot(rootElement).render(
    <StrictMode>
        <App />
        <SpeedInsights />
    </StrictMode>
);
