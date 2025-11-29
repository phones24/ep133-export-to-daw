import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'preact/hooks';
import { swUpdateAvailableAtom } from '~/atoms/swUpdate';

const RELOAD_DELAY_SECONDS = 3;

function UpdateNotifier({ className }: { className?: string }) {
  const updateAvailable = useAtomValue(swUpdateAvailableAtom);
  const [countdown, setCountdown] = useState(RELOAD_DELAY_SECONDS);

  useEffect(() => {
    if (!updateAvailable) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [updateAvailable]);

  if (!updateAvailable) {
    return null;
  }

  return (
    <div
      className={clsx(
        'bg-blue-200 text-blue-800 px-4 py-1 text-center text-sm border-b border-blue-300',
        className,
      )}
    >
      A new version is available. Reloading in {countdown} second{countdown !== 1 ? 's' : ''}...
    </div>
  );
}

export default UpdateNotifier;
