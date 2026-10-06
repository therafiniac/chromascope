import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Registers the service worker (production builds only) and, when a new version
 * is waiting, asks the user before replacing the running app.
 */
export default function UpdatePrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null,
  );
  const updateRequested = useRef(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

    // controllerchange also fires on the very first install. Reload only after
    // the user accepted an update, so a first visit is never interrupted.
    const onControllerChange = () => {
      if (updateRequested.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          installing?.addEventListener('statechange', () => {
            if (
              installing.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(installing);
            }
          });
        });
      })
      .catch((error: unknown) => {
        console.error('Service worker registration failed', error);
      });

    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);

  const applyUpdate = () => {
    updateRequested.current = true;
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:max-w-sm"
    >
      {waitingWorker && (
        <div className="bg-card text-card-foreground flex items-center justify-between gap-4 rounded-lg border p-4 shadow-lg">
          <p className="text-sm">A new version of Chromascope is available.</p>
          <Button onClick={applyUpdate}>Update</Button>
        </div>
      )}
    </div>
  );
}
