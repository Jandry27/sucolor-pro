import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save, X } from 'lucide-react';
import type { AdminOrder } from '@/types';

interface OrderDetailNotesCardProps {
    order: AdminOrder;
    saving: boolean;
    onAddEntry: (entry: string) => Promise<void>;
    onUpdateFull: (notes: string | null) => Promise<void>;
}

export function OrderDetailNotesCard({
    order,
    saving,
    onAddEntry,
    onUpdateFull,
}: OrderDetailNotesCardProps) {
    const [isEditingFull, setIsEditingFull] = useState(false);
    const [entryText, setEntryText] = useState('');
    const [fullText, setFullText] = useState('');

    const handleOpenFullEdit = () => {
        setFullText(order.notas_publicas || '');
        setIsEditingFull(true);
    };

    const handleSaveFull = async () => {
        const val = fullText.trim() === '' ? null : fullText;
        await onUpdateFull(val);
        setIsEditingFull(false);
    };

    const handleAddEntry = async () => {
        if (!entryText.trim()) return;
        await onAddEntry(entryText.trim());
        setEntryText('');
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && entryText.trim()) {
            await handleAddEntry();
        }
    };

    return (
        <motion.div
            className="glass-card"
            style={{ padding: '20px' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
        >
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#0B1220] dark:text-white">
                    Bitácora del Cliente
                </h2>
                {!isEditingFull && (
                    <button
                        onClick={handleOpenFullEdit}
                        className="text-xs text-[#FF5100] hover:text-[#0B1220] transition-colors font-medium"
                    >
                        Editar historial completo
                    </button>
                )}
            </div>

            {isEditingFull ? (
                /* Modo edición completa */
                <div className="space-y-3">
                    <textarea
                        value={fullText}
                        onChange={e => setFullText(e.target.value)}
                        rows={6}
                        placeholder="Historial completo de notas..."
                        className="w-full text-sm p-3 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] resize-none focus:outline-none focus:border-[#FF5100] focus:ring-1 focus:ring-[#FF5100] font-mono"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSaveFull}
                            disabled={saving}
                            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                        >
                            {saving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}{' '}
                            Guardar todo
                        </button>
                        <button
                            onClick={() => setIsEditingFull(false)}
                            disabled={saving}
                            className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs border-transparent hover:bg-[rgba(15,23,42,0.06)]"
                        >
                            <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                /* Modo añadir entrada */
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={entryText}
                            onChange={e => setEntryText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Añadir actualización a la bitácora..."
                            className="flex-1 text-sm px-3 py-2 rounded-lg border border-[rgba(15,23,42,0.15)] bg-[#F7F8FA] focus:outline-none focus:border-[#FF5100] focus:ring-1 focus:ring-[#FF5100]"
                        />
                        <button
                            onClick={handleAddEntry}
                            disabled={saving || !entryText.trim()}
                            className="btn-primary px-4 py-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Añadir'}
                        </button>
                    </div>

                    <div className="bg-[rgba(15,23,42,0.02)] border border-[rgba(15,23,42,0.06)] rounded-xl p-3">
                        {order.notas_publicas ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {order.notas_publicas
                                    .split('\n')
                                    .filter(l => l.trim().length > 0)
                                    .map((line, i) => (
                                        <p key={i} className="text-xs text-[rgba(11,18,32,0.70)]">
                                            {line}
                                        </p>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-xs text-[rgba(11,18,32,0.30)] italic text-center py-2">
                                No hay actualizaciones registradas.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
