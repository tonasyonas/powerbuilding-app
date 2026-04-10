import { useWebHaptics } from "web-haptics/react";

/**
 * App-level haptic patterns. Each function is a no-op if haptics
 * are unsupported (Android Vibration API / iOS Safari 17.4+).
 */
export function useHaptics() {
  const { trigger, isSupported } = useWebHaptics();

  return {
    isSupported,
    /** Light tap — nav, toggles, accordions */
    tap: () => trigger([{ duration: 15, intensity: 0.4, delay: 0 }]),
    /** Satisfying tick — set complete, saves */
    success: () => trigger("success"),
    /** Strong double-pulse — finish workout, milestones */
    heavy: () =>
      trigger([
        { duration: 30, intensity: 1, delay: 0 },
        { duration: 40, intensity: 1, delay: 80 },
      ]),
    /** Triple warning pulse — destructive confirms */
    warning: () =>
      trigger([
        { duration: 20, intensity: 0.8, delay: 0 },
        { duration: 20, intensity: 0.8, delay: 60 },
        { duration: 30, intensity: 1, delay: 60 },
      ]),
    /** Rising alert — rest timer done */
    alert: () =>
      trigger([
        { duration: 40, intensity: 0.6, delay: 0 },
        { duration: 60, intensity: 1, delay: 100 },
      ]),
  };
}
