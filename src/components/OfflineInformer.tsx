import clsx from 'clsx';
import { useEffect, useState } from 'preact/hooks';

function OfflineInformer({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className={clsx(
        'bg-yellow-200 text-yellow-800 px-4 py-1 text-center text-sm border-b border-yellow-300',
        className,
      )}
    >
      You’re currently offline, but the app is still working just fine!
    </div>
  );
}

export default OfflineInformer;
