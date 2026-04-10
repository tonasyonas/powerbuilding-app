import { useCallback, useRef } from "react";

/**
 * Plays a double-beep alert using the Web Audio API.
 * No audio files needed — generates tones programmatically.
 */
export function useTimerSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
      }
      const ctx = ctxRef.current;

      // Resume if suspended (mobile browsers require user gesture)
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      // Two short beeps: 880Hz (A5) for a clean alert tone
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = 880;
        osc.connect(gain);
        gain.connect(ctx.destination);

        const start = now + i * 0.2;
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

        osc.start(start);
        osc.stop(start + 0.15);
      }
    } catch {
      // Web Audio not supported — fail silently
    }
  }, []);

  return play;
}
