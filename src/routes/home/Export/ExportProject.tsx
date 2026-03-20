import { useState } from 'preact/hooks';
import IconArrowDialog from '~/components/icons/arrow-dialog.svg?react';
import Button from '~/components/ui/Button';
import { APP_STATES, useAppState } from '~/hooks/useAppState';
import ExportProjectDialog from './ExportProjectDialog';

function ExportProject() {
  const [open, setOpen] = useState(false);
  const appState = useAppState();

  return (
    <>
      <div className="flex gap-2 ">
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          disabled={!appState.includes(APP_STATES.CAN_EXPORT_PROJECT)}
          size="sm"
        >
          <span className="inline-flex items-center gap-2">
            <IconArrowDialog className="w-4 h-4" />
            <span>Export</span>
          </span>
        </Button>
      </div>

      {open && <ExportProjectDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

export default ExportProject;
