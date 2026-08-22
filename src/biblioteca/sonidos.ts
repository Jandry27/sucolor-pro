// ─── src/biblioteca/sonidos.ts ──────────────────────────────────────────────
// Sistema de sonidos estilo iOS / Apple: minimalistas, cristalinos y elegantes.
// Usa síntesis con múltiples osciladores, filtros low-pass y envelopes suaves
// para lograr ese acabado premium y profesional.
// ────────────────────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
    if (_ctx && _ctx.state !== 'closed') return _ctx;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
    return _ctx;
};

// ── Motor de síntesis premium ────────────────────────────────────────────────

interface ToneConfig {
    freq: number;
    type?: OscillatorType;
    /** Detuning en cents para calidez */
    detune?: number;
    /** Cuándo empieza esta nota (offset en segundos) */
    start?: number;
    /** Duración de la nota */
    duration?: number;
    /** Volumen relativo 0-1 */
    volume?: number;
    /** Frecuencia de corte del filtro low-pass (Hz). Más bajo = más suave */
    filterFreq?: number;
}

/**
 * Reproduce un sonido compuesto por múltiples tonos superpuestos.
 * Cada tono pasa por: Oscillator → LowPass Filter → Gain → Destination
 * Esto permite crear sonidos complejos, cálidos y "cristalinos" como iOS.
 */
const playSound = (tones: ToneConfig[]) => {
    try {
        const ac = getCtx();
        if (!ac) return;
        if (ac.state === 'suspended') ac.resume();

        const now = ac.currentTime;

        tones.forEach(tone => {
            const {
                freq,
                type = 'sine',
                detune = 0,
                start = 0,
                duration = 0.25,
                volume = 0.08,
                filterFreq = 4000,
            } = tone;

            const t0 = now + start;
            const attackEnd = t0 + Math.min(0.012, duration * 0.1);
            const decayStart = t0 + duration * 0.15;
            const end = t0 + duration;

            // Oscilador principal
            const osc = ac.createOscillator();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t0);
            osc.detune.setValueAtTime(detune, t0);

            // Segundo oscilador ligeramente desafinado (calidez)
            const osc2 = ac.createOscillator();
            osc2.type = type;
            osc2.frequency.setValueAtTime(freq, t0);
            osc2.detune.setValueAtTime(detune + 3, t0); // +3 cents = warmth sutil

            // Filtro low-pass para suavizar
            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(filterFreq, t0);
            filter.Q.setValueAtTime(0.7, t0);

            // Envelope de ganancia (ADSR simplificado)
            const gain = ac.createGain();
            gain.gain.setValueAtTime(0, t0);
            // Attack: subida rápida pero no instantánea (evita clicks)
            gain.gain.linearRampToValueAtTime(volume, attackEnd);
            // Decay: baja un poco al nivel de sustain
            gain.gain.linearRampToValueAtTime(volume * 0.7, decayStart);
            // Release: caída exponencial suave
            gain.gain.exponentialRampToValueAtTime(0.0001, end);

            // Routing
            osc.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(ac.destination);

            osc.start(t0);
            osc.stop(end + 0.05);
            osc2.start(t0);
            osc2.stop(end + 0.05);
        });
    } catch {
        /* audio es no-crítico */
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. ORDEN CREADA — "Tri-tone" estilo iOS mail sent
//    Tres notas cristalinas ascendentes, como un acorde roto de campana
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoOrdenCreada = () =>
    playSound([
        { freq: 784,  start: 0,    duration: 0.35, volume: 0.07, filterFreq: 5000 },     // G5
        { freq: 988,  start: 0.08, duration: 0.30, volume: 0.065, filterFreq: 4500 },    // B5
        { freq: 1319, start: 0.16, duration: 0.40, volume: 0.06, filterFreq: 4000 },     // E6
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 2. BITÁCORA — AÑADIR ENTRADA
//    "Tock" suave: nota corta y redonda, como tocar cristal
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoBitacoraEntrada = () =>
    playSound([
        { freq: 1047, start: 0, duration: 0.12, volume: 0.06, filterFreq: 3000 },        // C6
        { freq: 1568, start: 0, duration: 0.10, volume: 0.025, filterFreq: 2500 },       // G6 (armónico sutil)
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 3. BITÁCORA — GUARDAR HISTORIAL COMPLETO
//    Dos notas cálidas descendentes: "guardado con éxito"
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoBitacoraGuardada = () =>
    playSound([
        { freq: 880,  start: 0,    duration: 0.18, volume: 0.06, filterFreq: 3500 },     // A5
        { freq: 1047, start: 0.10, duration: 0.28, volume: 0.055, filterFreq: 3000 },    // C6
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 4. GASTO AGREGADO
//    "Tap" doble rápido: como confirmar con un toque preciso
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoGastoAgregado = () =>
    playSound([
        { freq: 698,  start: 0,    duration: 0.10, volume: 0.055, filterFreq: 3200 },    // F5
        { freq: 880,  start: 0.07, duration: 0.15, volume: 0.06,  filterFreq: 3000 },    // A5
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 5. GASTO ELIMINADO
//    Nota única descendente sutil — desaparición elegante
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoGastoEliminado = () =>
    playSound([
        { freq: 659, start: 0, duration: 0.18, volume: 0.045, filterFreq: 2500 },        // E5
        { freq: 523, start: 0, duration: 0.14, volume: 0.02,  filterFreq: 2000 },        // C5 ghost
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 6. PAGO REGISTRADO
//    "Ka-ching" minimalista: acorde mayor brillante y corto
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoPagoRegistrado = () =>
    playSound([
        { freq: 1047, start: 0,    duration: 0.15, volume: 0.06,  filterFreq: 4000 },    // C6
        { freq: 1319, start: 0,    duration: 0.15, volume: 0.04,  filterFreq: 3500 },    // E6
        { freq: 1568, start: 0.06, duration: 0.22, volume: 0.055, filterFreq: 3500 },    // G6
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 7. PAGO ELIMINADO
//    Nota baja suave que se desvanece — retiro discreto
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoPagoEliminado = () =>
    playSound([
        { freq: 523, start: 0, duration: 0.2,  volume: 0.045, filterFreq: 2200 },        // C5
        { freq: 440, start: 0, duration: 0.18, volume: 0.02,  filterFreq: 1800 },        // A4 ghost
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 8. PAGO COMPLETO — ¡Celebración!
//    Arpegio ascendente de 3 notas + acorde final, cristalino
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoPagoCompleto = () =>
    playSound([
        { freq: 1047, start: 0,    duration: 0.12, volume: 0.055, filterFreq: 5000 },    // C6
        { freq: 1319, start: 0.08, duration: 0.12, volume: 0.055, filterFreq: 4800 },    // E6
        { freq: 1568, start: 0.16, duration: 0.12, volume: 0.06,  filterFreq: 4500 },    // G6
        // Acorde final que resuena
        { freq: 2093, start: 0.24, duration: 0.45, volume: 0.05,  filterFreq: 4000 },    // C7
        { freq: 1568, start: 0.24, duration: 0.40, volume: 0.03,  filterFreq: 3500 },    // G6
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 9. ESTADO CAMBIADO
//    Dos notas limpias ascendentes — transición fluida
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoEstadoCambiado = () =>
    playSound([
        { freq: 659,  start: 0,    duration: 0.14, volume: 0.055, filterFreq: 3500 },    // E5
        { freq: 880,  start: 0.09, duration: 0.20, volume: 0.06,  filterFreq: 3200 },    // A5
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 10. DETALLES GUARDADOS (cliente/vehículo/total editado)
//     Nota única limpia con armónico — confirmación mínima
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoDetallesGuardados = () =>
    playSound([
        { freq: 880,  start: 0, duration: 0.18, volume: 0.055, filterFreq: 3000 },       // A5
        { freq: 1760, start: 0, duration: 0.14, volume: 0.018, filterFreq: 2500 },       // A6 (octava ghost)
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 11. TOGGLE COMPARTIR
//     Micro-blip: casi imperceptible pero presente
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoToggle = () =>
    playSound([
        { freq: 1319, start: 0, duration: 0.08, volume: 0.04, filterFreq: 2800 },        // E6
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 12. ORDEN / ELEMENTO ELIMINADO
//     Tono grave corto y redondo — desaparición con peso
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoOrdenEliminada = () =>
    playSound([
        { freq: 330,  start: 0,    duration: 0.15, volume: 0.05, filterFreq: 1800 },     // E4
        { freq: 262,  start: 0.08, duration: 0.20, volume: 0.04, filterFreq: 1500 },     // C4
    ]);

// ═══════════════════════════════════════════════════════════════════════════
// 13. ERROR
//     Dos "taps" graves y amortiguados — firme pero no agresivo
// ═══════════════════════════════════════════════════════════════════════════
export const sonidoError = () =>
    playSound([
        { freq: 262,  start: 0,    duration: 0.12, volume: 0.055, filterFreq: 1200, type: 'triangle' },  // C4
        { freq: 247,  start: 0.10, duration: 0.15, volume: 0.05,  filterFreq: 1000, type: 'triangle' },  // B3
    ]);

// ── Aliases retrocompatibles ─────────────────────────────────────────────────
export const reproducirExito = sonidoOrdenCreada;
export const reproducirNotificacion = sonidoEstadoCambiado;
export const reproducirError = sonidoError;
