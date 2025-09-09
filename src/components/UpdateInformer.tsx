import { useEffect, useState } from 'preact/hooks';
import Button from './ui/Button';

function UpdateInformer() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        const checkForUpdates = () => {
          reg.update();
        };

        checkForUpdates();

        const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

        return () => clearInterval(interval);
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      navigator.serviceWorker.addEventListener(
        'controllerchange',
        () => {
          window.location.reload();
        },
        { once: true },
      );
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm flex items-center justify-between">
      <span>App update available! Click to refresh and apply the latest version.</span>
      <Button onClick={handleUpdate} variant="secondary" size="sm" className="ml-auto">
        Update Now
      </Button>
    </div>
  );
}

export default UpdateInformer;
