let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignorieren, falls noch keine Nutzerinteraktion stattfand
    });
  }
  return audioCtx;
}

export function triggerHaptic(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Manche Browser blockieren vibrate ohne Berechtigung
    }
  }
}

/**
 * Sanfter Klickton beim Tippen auf das Kinder-Keypad
 */
export function playKeyTap(soundEnabled: boolean): void {
  triggerHaptic(8);
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(340, now + 0.03);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.035);
}

/**
 * Angenehmer Doppelton (bzw. Dreiklang bei Blitz-Antwort) bei richtiger Lösung
 */
export function playSuccessSound(soundEnabled: boolean, isFast = false): void {
  triggerHaptic(isFast ? [18, 30, 35] : [20, 25]);
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = isFast ? [523.25, 659.25, 783.99] : [523.25, 659.25]; // C5 -> E5 (-> G5)

  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.095;
    const duration = idx === notes.length - 1 ? 0.28 : 0.14;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.22, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  });
}

/**
 * Dumpfer, sanfter Ton bei falscher Eingabe (ohne Kinder zu erschrecken)
 */
export function playErrorSound(soundEnabled: boolean): void {
  triggerHaptic([45, 40, 65]);
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(420, now);
  filter.connect(ctx.destination);

  const notes = [210, 165];
  notes.forEach((freq, idx) => {
    const start = now + idx * 0.12;
    const dur = 0.18;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.linearRampToValueAtTime(freq * 0.92, start + dur);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(filter);

    osc.start(start);
    osc.stop(start + dur + 0.01);
  });
}

/**
 * Fröhliche Melodie zum Abschluss einer Trainingsrunde
 */
export function playCelebrationSound(soundEnabled: boolean): void {
  triggerHaptic([25, 40, 25, 40, 60]);
  if (!soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  melody.forEach((freq, i) => {
    const start = now + i * 0.11;
    const dur = i === melody.length - 1 ? 0.45 : 0.16;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.24, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + dur + 0.02);
  });
}

