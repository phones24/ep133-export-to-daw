import clsx from 'clsx';
import { useEffect, useRef } from 'preact/hooks';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: any;
  className?: string;
  containerClassName?: string;
}

function Dialog({
  isOpen,
  onClose,
  children,
  className = '',
  containerClassName = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className={clsx(
        'shadow-lg backdrop:bg-black/40 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-1 border-black outline-none overflow-visible',
        className,
      )}
      onClose={onClose}
    >
      <div className={clsx('bg-white p-4 rounded-md min-w-75 min-h-25', containerClassName)}>
        {children}
      </div>
    </dialog>
  );
}

export default Dialog;
