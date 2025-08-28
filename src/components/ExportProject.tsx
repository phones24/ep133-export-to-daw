import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { APP_STATES, useAppState } from '../hooks/useAppState';
import useDevice from '../hooks/useDevice';
import useExportProject, { exportFormats } from '../hooks/useExportProject';
import { ExportFormatId } from '../types';
import IconFile from './icons/file.svg?react';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import Select from './ui/Select';

function ExportProject() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormatId>(exportFormats[0].value);
  const appState = useAppState();
  const { device } = useDevice();
  const { startExport, isPending, pendingStatus, percentage, reset, result, error } =
    useExportProject(format);

  useEffect(() => {
    reset();
  }, [format]);

  const handleOpen = () => {
    reset();
    setOpen(true);
  };

  return (
    <>
      <div className="flex gap-2 ">
        <Button onClick={handleOpen} disabled={!appState.includes(APP_STATES.CAN_EXPORT_PROJECT)}>
          Export...
        </Button>
      </div>

      <Dialog isOpen={open && !!device} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-2 min-w-[600px]">
          <p>Select file format</p>
          <Select
            onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
              setFormat(e.currentTarget.value as ExportFormatId)
            }
            value={format}
            name="format"
            disabled={isPending}
            className="mr-auto"
          >
            {exportFormats.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4 min-h-[54px]">
          {percentage > 0 && (
            <>
              <div className="h-[30px] border-1 border-black bg-[#ccc]">
                <div className="h-full bg-[#ef4e27]" style={{ width: `${percentage}%` }} />
              </div>
              <div className="text-sm text-black min-h-5 text-center mt-1">{pendingStatus}</div>
            </>
          )}

          {result && percentage >= 100 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Files to download</h3>
              {result.files.map((f) => (
                <div key={f.name} className="flex gap-2">
                  <IconFile className="w-6 h-6" />
                  <a href={f.url} download={f.name} className="text-blue-500">
                    {f.name}
                  </a>
                  <span className="ml-auto text-sm opacity-80">{(f.size / 1024).toFixed(2)}KB</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-100 p-4">
              <h3 className="text-lg font-semibold text-center">Error</h3>
              <p className="text-sm text-red-500 text-center">
                Please, report this error to the developer.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4 justify-end mt-20">
          <Button onClick={() => setOpen(false)} variant="secondary" disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={startExport} disabled={isPending}>
            Export
          </Button>
        </div>
      </Dialog>
    </>
  );
}

export default ExportProject;
