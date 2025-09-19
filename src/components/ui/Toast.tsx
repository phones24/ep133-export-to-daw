import clsx from 'clsx';
import { useAtom } from 'jotai';
import { useEffect, useRef } from 'preact/hooks';
import { removeToastAtom, type ToastMessage, toastsAtom } from '../../atoms/toast';
import Button from './Button';

const TOAST_DURATION = 5000;

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toastRef.current) {
      toastRef.current.showPopover();
    }
  }, [toast.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div ref={toastRef} popover>
      <div
        className={clsx(
          'flex gap-8 items-center px-4 py-3 shadow-md max-w-[500px] w-full text-black/90 border-1 border-gray-800',
          'transform transition-all duration-300 ease-out',
          toast.severity === 'error' ? 'bg-red-500' : 'bg-[#f0927a]',
        )}
      >
        <p className="flex-1">{toast.message}</p>
        <Button variant="primary" size="sm" onClick={() => onRemove(toast.id)} className="ml-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}

function Toast() {
  const [toasts] = useAtom(toastsAtom);
  const [, removeToast] = useAtom(removeToastAtom);

  return (
    <>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </>
  );
}

export default Toast;
