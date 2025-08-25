import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { APP_STATES, useAppState } from '../hooks/useAppState';
import useDevice from '../hooks/useDevice';
import useExportProject, { ExportFormatId, exportFormats } from '../hooks/useExportProject';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import Select from './ui/Select';

function ExportProject() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormatId>(exportFormats[0].value);
  const appState = useAppState();
  const { device } = useDevice();
  const { startExport, isPending, pendingStatus, percentage } = useExportProject(format);

  return (
    <>
      <div className="flex gap-2 ">
        <Button
          onClick={() => setOpen(true)}
          disabled={!appState.includes(APP_STATES.CAN_EXPORT_PROJECT)}
        >
          Export...
        </Button>
      </div>

      <Dialog isOpen={open && !!device} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-2">
          <p>
            Select file format
            <br />
            <span className="text-sm opacity-80">
              currently only DAWproject is supported (
              <a
                href="https://github.com/bitwig/dawproject"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://github.com/bitwig/dawproject
              </a>
              )
            </span>
          </p>
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
                <div
                  className="h-full bg-[#ef4e27] transition-all duration-200"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-sm text-black min-h-5 text-center mt-1">{pendingStatus}</div>
            </>
          )}
        </div>

        <div className="flex gap-4 justify-end mt-10">
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
