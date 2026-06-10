"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAdminSessionOptions {
  /** Total idle minutes before the session expires. Default: 20 */
  idleMinutes?: number;
  /** Minutes before expiry when the warning fires. Default: 1 */
  warningMinutes?: number;
  /** Called once when the idle threshold is reached (auto-logout here). */
  onIdle: () => void;
  /**
   * Called every second during the warning countdown.
   * Receives the number of seconds remaining.
   */
  onWarning: (secondsLeft: number) => void;
  /** Called when activity is detected during the warning window. */
  onActivityResume?: () => void;
}

/**
 * useAdminSession — idle-session timeout hook.
 *
 * Listens for mouse/keyboard/touch events and resets two timers:
 *   1. Warning timer  — fires (idleMinutes - warningMinutes) after last activity
 *   2. Idle timer     — fires at idleMinutes after last activity → triggers onIdle()
 *
 * Returns `{ reset }` so the caller can manually dismiss the warning.
 */
export function useAdminSession({
  idleMinutes = 20,
  warningMinutes = 1,
  onIdle,
  onWarning,
  onActivityResume,
}: UseAdminSessionOptions) {
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningActive = useRef(false);

  // Stable refs for callbacks so we don't re-create the listeners on every render
  const onIdleRef = useRef(onIdle);
  const onWarningRef = useRef(onWarning);
  const onActivityResumeRef = useRef(onActivityResume);
  useEffect(() => { onIdleRef.current = onIdle; }, [onIdle]);
  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);
  useEffect(() => { onActivityResumeRef.current = onActivityResume; }, [onActivityResume]);

  const clearAllTimers = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    idleTimer.current = null;
    warningTimer.current = null;
    countdownRef.current = null;
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    warningActive.current = false;

    const idleMs = idleMinutes * 60_000;
    const warningMs = (idleMinutes - warningMinutes) * 60_000;

    // Warning timer — fires before idle
    warningTimer.current = setTimeout(() => {
      warningActive.current = true;
      let secondsLeft = warningMinutes * 60;
      onWarningRef.current(secondsLeft);

      countdownRef.current = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          onWarningRef.current(secondsLeft);
        } else {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 1_000);
    }, warningMs);

    // Idle timer — fires after full idle period
    idleTimer.current = setTimeout(() => {
      clearAllTimers();
      onIdleRef.current();
    }, idleMs);
  }, [idleMinutes, warningMinutes, clearAllTimers]);

  const handleActivity = useCallback(() => {
    if (warningActive.current) {
      onActivityResumeRef.current?.();
    }
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;
    EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    startTimers(); // kick off on mount

    return () => {
      EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
  }, [handleActivity, startTimers, clearAllTimers]);

  return {
    /** Manually reset the idle timer (e.g. after "Stay Logged In" is clicked). */
    reset: startTimers,
  };
}
