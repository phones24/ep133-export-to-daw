import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'preact/hooks';
import { deviceSkuAtom } from '~/atoms/deviceSku';
import Button from '~/components/ui/Button';
import { SKU_EP40 } from '~/lib/constants';
import Dialog from '../../components/ui/Dialog';

function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const deviceSku = useAtomValue(deviceSkuAtom);

  useEffect(() => {
    if (deviceSku && !localStorage.getItem('riddim-dialog-shown') && deviceSku === SKU_EP40) {
      setOpen(true);
    }
  }, [deviceSku]);

  const handleClose = () => {
    localStorage.setItem('riddim-dialog-shown', 'true');
    setOpen(false);
  };

  return (
    <Dialog isOpen={open} onClose={handleClose}>
      <div className="flex flex-col gap-4 min-w-[600px]">
        <img src="/riddim.png" alt="Riddim Logo" className="w-20" />
        <p>Hey, looks like you are using EP-40 Riddim!</p>
        <p>
          Unfortunately not all features are supported at the moment. Since I don't own the real
          device I can only explore the backups and blindly guess how things work.
        </p>
        <p>
          If you would like to help me improve the support for EP-40 Riddim, please share your
          experience with the current implementation via feedback form or email.
        </p>
        <p>And if you like the project, please consider donating!</p>
        <p>Thank you for your understanding and support.</p>
        <div className="flex gap-4 justify-end mt-6">
          <Button onClick={() => setOpen(false)} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default FeedbackDialog;
