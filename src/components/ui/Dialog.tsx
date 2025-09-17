import clsx from 'clsx';
import { useEffect, useRef } from 'preact/hooks';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: any;
  className?: string;
}

function Dialog({ isOpen, onClose, children, className = '' }: DialogProps) {
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
      className="shadow-lg backdrop:bg-black/40 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-1 border-black outline-none overflow-visible"
      onClose={onClose}
    >
      <div className={clsx('bg-white p-4 rounded-md min-w-[300px] min-h-[100px]', className)}>
        {children}
      </div>
    </dialog>
  );
}

export default Dialog;
