import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { APP_STATES, useAppState } from '../hooks/useAppState';
import useDevice from '../hooks/useDevice';
import useExportProject, { EXPORT_FORMATS } from '../hooks/useExportProject';
import usePersistedState from '../hooks/usePersistedState';
import { ExportFormatId } from '../types/types';
import IconFile from './icons/file.svg?react';
import Button from './ui/Button';
import CheckBox from './ui/CheckBox';
import Dialog from './ui/Dialog';
import Select from './ui/Select';

const NOTES: Record<ExportFormatId, string> = {
  ableton: `Please note that the exported project won't sound exactly the same as it does on the device. Currently NOT included in export: effects, fader automation, song mode, sidechains`,
  dawproject: ``,
  midi: ``,
};

function ExportProject() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormatId>(EXPORT_FORMATS[0].value);
  const [includeArchivedSamples, setIncludeArchivedSamples] = usePersistedState(
    'export_includeArchivedSamples',
    true,
  );
  const [useSampler, setUseSampler] = usePersistedState('export_useSampler', false);
  const [clips, setClips] = usePersistedState('export_clips', false);
  const appState = useAppState();
  const { device } = useDevice();
  const { startExport, isPending, pendingStatus, percentage, reset, result, error, sampleReport } =
    useExportProject(format, { includeArchivedSamples, useSampler, clips });

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
      {open && !!device && (
        <Dialog isOpen onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-2 min-w-[600px]">
            <p>Select project format</p>
            <Select
              onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) =>
                setFormat(e.currentTarget.value as ExportFormatId)
              }
              value={format}
              name="format"
              disabled={isPending}
              className="mr-auto"
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.name}
                </option>
              ))}
            </Select>
            <div className="flex flex-col gap-2 mt-2">
              {format !== 'ableton' && (
                <CheckBox
                  checked={includeArchivedSamples}
                  onChange={(checked) => setIncludeArchivedSamples(checked)}
                  title="Include archived WAV samples"
                  disabled={isPending}
                />
              )}

              {format === 'ableton' && (
                <>
                  <CheckBox
                    checked={includeArchivedSamples}
                    onChange={(checked) => setIncludeArchivedSamples(checked)}
                    title="Include samples"
                    disabled={isPending}
                  />

                  <CheckBox
                    checked={useSampler}
                    onChange={(checked) => setUseSampler(checked)}
                    title="Use «Sampler» instead of «Simpler»"
                    disabled={isPending || !includeArchivedSamples}
                  />
                  <CheckBox
                    checked={clips}
                    onChange={(checked) => setClips(checked)}
                    title="Session clips instead of arrangements"
                    disabled={isPending}
                  />
                </>
              )}

              {format === 'dawproject' && (
                <CheckBox
                  checked={clips}
                  onChange={(checked) => setClips(checked)}
                  title="Export with clips"
                  disabled={isPending}
                />
              )}
            </div>

            {NOTES[format] && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="text-sm whitespace-pre-line">{NOTES[format]}</div>
              </div>
            )}
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
                  <div key={f.name} className="flex gap-2 items-center">
                    <IconFile className="w-6 h-6" />
                    <a href={f.url} download={f.name} className="text-blue-500">
                      {f.name}
                    </a>
                    <span className="mr-auto text-sm opacity-80 ml-2">
                      {(f.size / 1024).toFixed(2)}KB
                    </span>
                  </div>
                ))}

                {sampleReport && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">Sample Report</h3>
                    <div className="text-sm">
                      <p className="text-green-600">
                        ✓ Downloaded: {sampleReport.downloaded.length} samples
                      </p>
                      {sampleReport.missing.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-600">
                            ✗ Missing: {sampleReport.missing.length} samples
                          </p>
                          <ul className="mt-1 ml-4 max-h-[100px] overflow-y-auto">
                            {sampleReport.missing.map((missing, index) => (
                              <li key={index} className="text-red-500 text-xs truncate">
                                {missing.name}: {missing.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-100 p-4">
                <h3 className="text-lg font-semibold text-center">Error</h3>
                <p className="text-sm text-red-500 text-center">
                  Opps, that's not good. Hope the error tracking system helps me to find the
                  problem.
                  <br />
                  Please try again in a day or two or report this error to the developer with EMAIL
                  button in the corner.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end mt-2">
            <Button onClick={() => setOpen(false)} variant="secondary" disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={startExport} disabled={isPending}>
              Export
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default ExportProject;
