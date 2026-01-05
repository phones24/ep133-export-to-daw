import { useAtom } from 'jotai';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import IconArrowDialog from '~/components/icons/arrow-dialog.svg?react';
import IconFile from '~/components/icons/file.svg?react';
import { feedbackDialogAtom } from '../../atoms/feedbackDialog';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import Select from '../../components/ui/Select';
import { APP_STATES, useAppState } from '../../hooks/useAppState';
import useExportProject, { EXPORT_FORMATS } from '../../hooks/useExportProject';
import usePersistedState from '../../hooks/usePersistedState';
import { ExportFormatId } from '../../types/types';
import ExportOptions from './ExportOptions';
import ExportScenes from './ExportScenes';

const NOTES: Record<ExportFormatId, string> = {
  ableton: `Please note that the exported project won't sound exactly the same as it does on the device.`,
  dawproject: `Unfortunately, the DAWproject format does not currently support the "Sampler" instrument, so you will need to manually assign the samples in your DAW.`,
  midi: `The simplest format supported by any DAW. But you have to assign the samples manually.`,
  reaper: `Only basic sampler features are supported`,
};

function ExportProject() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = usePersistedState('export_format', EXPORT_FORMATS[0].value);
  const [includeArchivedSamples, setIncludeArchivedSamples] = usePersistedState(
    'export_includeArchivedSamples',
    true,
  );
  const [clips, setClips] = usePersistedState('export_clips', false);
  const [groupTracks, setGroupTracks] = usePersistedState('export_groupTracks', true);
  const [drumRackGroupA, setDrumRackGroupA] = usePersistedState('export_drumRackGroupA', false);
  const [drumRackGroupB, setDrumRackGroupB] = usePersistedState('export_drumRackGroupB', false);
  const [drumRackGroupC, setDrumRackGroupC] = usePersistedState('export_drumRackGroupC', false);
  const [drumRackGroupD, setDrumRackGroupD] = usePersistedState('export_drumRackGroupD', false);
  const [sendEffects, setSendEffects] = usePersistedState('export_sendEffects', true);
  const [allScenes, setAllScenes] = useState(true);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);
  const appState = useAppState();
  const {
    startExport,
    cancelExport,
    isPending,
    pendingStatus,
    percentage,
    reset,
    result,
    error,
    sampleReport,
  } = useExportProject(format, {
    includeArchivedSamples,
    clips,
    groupTracks,
    drumRackGroupA,
    drumRackGroupB,
    drumRackGroupC,
    drumRackGroupD,
    sendEffects,
    allScenes,
    selectedScenes,
  });
  const [_, openFeedbackDialog] = useAtom(feedbackDialogAtom);

  const canExport = allScenes || selectedScenes.length > 0;

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
        <Button
          variant="secondary"
          onClick={handleOpen}
          disabled={!appState.includes(APP_STATES.CAN_EXPORT_PROJECT)}
          size="sm"
        >
          <span className="inline-flex items-center gap-2">
            <IconArrowDialog className="w-4 h-4" />
            <span>Export</span>
          </span>
        </Button>
      </div>

      {open && (
        <Dialog isOpen onClose={() => setOpen(false)} className="min-w-200">
          <div className="flex flex-col gap-2 min-w-150 max-w-175">
            <h3 className="text-lg font-semibold">Export</h3>
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
            <div className="flex gap-14 mt-2">
              <ExportOptions
                format={format}
                includeArchivedSamples={includeArchivedSamples}
                onIncludeArchivedSamplesChange={setIncludeArchivedSamples}
                clips={clips}
                onClipsChange={setClips}
                groupTracks={groupTracks}
                onGroupTracksChange={setGroupTracks}
                drumRackGroupA={drumRackGroupA}
                onDrumRackGroupAChange={setDrumRackGroupA}
                drumRackGroupB={drumRackGroupB}
                onDrumRackGroupBChange={setDrumRackGroupB}
                drumRackGroupC={drumRackGroupC}
                onDrumRackGroupCChange={setDrumRackGroupC}
                drumRackGroupD={drumRackGroupD}
                onDrumRackGroupDChange={setDrumRackGroupD}
                sendEffects={sendEffects}
                onSendEffectsChange={setSendEffects}
                disabled={isPending}
              />

              <ExportScenes
                allScenes={allScenes}
                onAllScenesChange={setAllScenes}
                selectedScenes={selectedScenes}
                onSelectedScenesChange={setSelectedScenes}
                disabled={isPending}
              />
            </div>

            {NOTES[format] && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="text-sm whitespace-pre-line">{NOTES[format]}</div>
              </div>
            )}
          </div>

          <div className="mt-4 min-h-13.5">
            {percentage > 0 && (
              <>
                <div className="h-7.5 border border-black bg-[#ccc]">
                  <div className="h-full bg-brand" style={{ width: `${percentage}%` }} />
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
                          <ul className="mt-1 ml-4 max-h-25 overflow-y-auto">
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
              <div className="my-4 bg-red-100/50 p-4">
                <h3 className="text-lg font-semibold text-center">Error</h3>
                <p className="text-sm text-red-500 text-center">
                  Opps, that's not good. Hope the error tracking system helps me to find the
                  problem. If you can, please submit an error report - it really helps me fix things
                  faster. Thanks!
                </p>
                <div className="text-center mt-5"></div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-5">
            <Button
              variant="secondary"
              className="mr-auto"
              onClick={() => openFeedbackDialog(true)}
            >
              Submit error report
            </Button>
            {isPending ? (
              <Button variant="secondary" onClick={cancelExport}>
                Cancel
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
            )}
            <Button onClick={startExport} disabled={isPending || !canExport} variant="primary">
              Export
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export default ExportProject;
