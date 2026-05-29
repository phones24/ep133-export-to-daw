import { useEffect, useState } from 'preact/hooks';
import Button from '~/components/ui/Button';
import Dialog from '../../components/ui/Dialog';

function EPToolkitDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('eptoolkit-dialog-shown')) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('eptoolkit-dialog-shown', 'true');
    setOpen(false);
  };

  return (
    <Dialog isOpen={open} onClose={handleClose} containerClassName="bg-creme! p-6! bg-grid">
      <div className="flex gap-6 min-w-200 ">
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3">
            <img src="/eptoolkit/eptoolkit-logo.png" alt="EP Toolkit" className="w-10 h-10" />
            <h2 className="text-xl font-bold">EP Toolkit is here!</h2>
          </div>

          <p className="text-base leading-5">
            Hey! I just released <strong>EP Toolkit</strong> - an all-in-one toolkit for EP series
            devices.
          </p>
          <p className="text-sm text-black">A standalone cross-platform app for all your needs:</p>
          <ul className="text-sm text-black/70 list-disc list-inside space-y-1">
            <li>Export projects to popular DAW formats</li>
            <li>
              Manage samples: batch copy from local drive, copy &amp; paste between slots, decode to
              mono, trim silence, normalize, batch remove
            </li>
            <li>Create and explore backups</li>
            <li>No browser required!</li>
          </ul>

          <a
            href="https://eptoolkit.ep133-to-daw.cc/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-500 font-bold text-base mt-1 underline focus:outline-none"
          >
            https://eptoolkit.ep133-to-daw.cc
          </a>
        </div>

        <div className="relative w-80 shrink-0">
          <img
            src="/eptoolkit/eptoolkit-2.png"
            alt="EP Toolkit screenshot 2"
            className="h-37 rounded border border-black/10 shadow-md absolute top-11 left-1"
          />
          <img
            src="/eptoolkit/eptoolkit-3.png"
            alt="EP Toolkit screenshot 3"
            className="h-37 rounded border border-black/10 shadow-md absolute top-30 left-6"
          />
          <img
            src="/eptoolkit/eptoolkit-1.png"
            alt="EP Toolkit screenshot 1"
            className="h-37 rounded border border-black/10 shadow-md absolute top-20 left-18"
          />
        </div>
      </div>
      <div className="flex justify-end mt-auto pt-4">
        <Button onClick={handleClose} variant="secondary">
          Close
        </Button>
      </div>
    </Dialog>
  );
}

export default EPToolkitDialog;
