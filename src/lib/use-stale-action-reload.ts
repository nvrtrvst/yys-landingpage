"use client";

import { useEffect } from "react";

export function useStaleActionReload(error: Error) {
  useEffect(() => {
    if (!/failed to find server action/i.test(error.message)) return;

    let shouldReload = true;
    try {
      const key = "stale-action-reload-at";
      const last = Number(window.sessionStorage.getItem(key) || 0);
      if (Date.now() - last < 10000) shouldReload = false;
      else window.sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // sessionStorage can be unavailable; reload once without the guard.
    }

    if (shouldReload) window.location.reload();
  }, [error]);
}
