import { useEffect, useRef, useState } from 'react';

interface ConnectivityState {
  online: boolean;
  checking: boolean;
  lastChangeTs: number | null;
}

function timeoutFetch(url: string, ms = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(id));
}

export function useConnectivity(pollMs: number = 15000): ConnectivityState {
  const [state, setState] = useState<ConnectivityState>({ online: true, checking: false, lastChangeTs: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const update = (online: boolean) => {
      setState(prev => ({ online, checking: false, lastChangeTs: prev.online !== online ? Date.now() : prev.lastChangeTs }));
    };

    // Initial navigator hint
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) update((navigator as any).onLine);

    const check = async () => {
      if (!mounted.current) return;
      setState(prev => ({ ...prev, checking: true }));
      try {
        // Use a 204 endpoint commonly whitelisted (Google); fall back to expo.dev ping on error
        const ok = await timeoutFetch('https://clients3.google.com/generate_204', 4000)
          .then(r => r.ok)
          .catch(() => false);
        if (ok) update(true);
        else {
          const ok2 = await timeoutFetch('https://expo.dev', 4000)
            .then(r => r.ok)
            .catch(() => false);
          update(ok2);
        }
      } catch {
        update(false);
      }
    };

    check();
    const interval = setInterval(check, pollMs);

    const handleOnline = () => update(true);
    const handleOffline = () => update(false);
    window.addEventListener?.('online', handleOnline);
    window.addEventListener?.('offline', handleOffline);

    return () => {
      mounted.current = false;
      clearInterval(interval);
      window.removeEventListener?.('online', handleOnline);
      window.removeEventListener?.('offline', handleOffline);
    };
  }, [pollMs]);

  return state;
}
