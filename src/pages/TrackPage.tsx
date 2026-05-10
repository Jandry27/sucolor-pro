import { useParams, useSearchParams, Link } from 'react-router-dom';
import { RefreshCw, Home } from 'lucide-react';
import { useTrackOrder } from '@/hooks/useTrackOrder';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { OrderHeader } from '@/components/OrderHeader';
import { OrderProgress } from '@/components/OrderProgress';
import { MediaGallery } from '@/components/MediaGallery';
import { PublicGastosPanel } from '@/components/PublicGastosPanel';
import { PublicNotes } from '@/components/PublicNotes';


export function TrackPage() {
    const { codigo } = useParams<{ codigo: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const { data, loading, error, refetch } = useTrackOrder({ codigo: codigo ?? '', token });

    if (loading) return <LoadingSkeleton />;
    if (error || !data) return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={refetch} />;

    const { order, gastos, media } = data;

    return (
        <div className="min-h-screen mesh-gradient">
            {/* ── Header ──── */}
            <header className="sticky top-0 z-30 bg-white/65 dark:bg-slate-900/65 backdrop-blur-2xl border-b border-white/40 dark:border-slate-800/50 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-[rgba(11,18,32,0.40)] hover:text-[#FF5100] transition-colors">
                            <Home className="w-4 h-4" />
                        </Link>
                        <span className="text-[rgba(15,23,42,0.15)]">/</span>
                        <img src="/logo.png" alt="SuColor" className="h-7 w-auto object-contain" />
                    </div>
                    <div className="flex items-center gap-2.5">

                        <span className="hidden sm:flex items-center chip-orange font-mono-code text-xs">
                            {order.codigo}
                        </span>
                        <button
                            onClick={refetch}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0F172A] dark:text-slate-200 border border-white/60 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 hover:bg-white/90 dark:hover:bg-slate-700/50 shadow-sm transition-all duration-200"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Actualizar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content ───── */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-5">
                <OrderHeader order={order} />
                <OrderProgress estado={order.estado} />
                <PublicNotes notes={order.notas_publicas} />
                <MediaGallery media={media} />
                <PublicGastosPanel gastos={gastos} />
            </main>

            {/* ── Footer ──── */}
            <footer className="border-t border-white/40 dark:border-slate-800/50 mt-12 bg-white/20 dark:bg-slate-900/40 backdrop-blur-md">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12 sm:pb-8 text-center">
                    <p className="text-xs text-[rgba(11,18,32,0.35)] dark:text-slate-500">
                        © {new Date().getFullYear()} SuColor — Portal de seguimiento de órdenes
                    </p>
                </div>
            </footer>
        </div>
    );
}
