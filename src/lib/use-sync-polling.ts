"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useSyncPolling(
  poll: () => Promise<boolean>,
  { intervalMs = 2000, maxAttempts = 8 }: { intervalMs?: number; maxAttempts?: number } = {}
) {
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(poll);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    pollRef.current = poll;
  }, [poll]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPolling(false);
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) return;
    setPolling(true);
    let attempts = 0;

    const tick = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      attempts += 1;
      try {
        const done = await pollRef.current();
        if (done || attempts >= maxAttempts) stop();
      } catch {
        if (attempts >= maxAttempts) stop();
      } finally {
        inFlightRef.current = false;
      }
    };

    void tick();
    timerRef.current = setInterval(tick, intervalMs);
  }, [intervalMs, maxAttempts, stop]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return { polling, start, stop };
}
