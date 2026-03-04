import { useParams, useSearchParams, Link } from 'react-router-dom';
import { RefreshCw, Home } from 'lucide-react';
import { useTrackOrder } from '@/hooks/useTrackOrder';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { OrderHeader } from '@/components/OrderHeader';
import { OrderProgress } from '@/components/OrderProgress';
import { MediaGallery } from '@/components/MediaGallery';
import { Timeline } from '@/components/Timeline';
import { PublicNotes } from '@/components/PublicNotes';

export function TrackPage() {
    const { codigo } = useParams<{ codigo: string }>();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';

    const { data, loading, error, refetch } = useTrackOrder({ codigo: codigo ?? '', token });

    if (loading) return <LoadingSkeleton />;
    if (error || !data) return <ErrorState message={error ?? 'No se pudo cargar la orden.'} onRetry={refetch} />;

    const { order, timeline, media } = data;

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#F7F8FA' }}>
            {/* ── Header ──── */}
            <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-[rgba(15,23,42,0.07)]">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[rgba(11,18,32,0.55)] hover:text-[#0B1220] border border-[rgba(15,23,42,0.10)] bg-white hover:bg-[rgba(15,23,42,0.03)] transition-all duration-150"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Actualizar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ── Content ───── */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
                <OrderHeader order={order} />
                <OrderProgress estado={order.estado} />
                <PublicNotes notes={order.notas_publicas} />
                <MediaGallery media={media} />
                <Timeline events={timeline} />
            </main>

            {/* ── Footer ──── */}
            <footer className="border-t border-[rgba(15,23,42,0.07)] mt-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center">
                    <p className="text-xs text-[rgba(11,18,32,0.35)]">
                        © {new Date().getFullYear()} SuColor — Portal de seguimiento de órdenes
                    </p>
                </div>
            </footer>
        </div>
    );
}
