import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'preact/hooks';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { feedbackDialogAtom } from '~/atoms/feedbackDialog';
import { projectIdAtom } from '~/atoms/project';
import InputField from '~/components/form/InputField';
import SelectField from '~/components/form/SelectField';
import IconFile from '~/components/icons/file.svg?react';
import Button from '~/components/ui/Button';
import Dialog from '~/components/ui/Dialog';
import useExportProject, { EXPORT_FORMATS } from '~/hooks/useExportProject';
import { usePersistedFormValues } from '~/hooks/usePersistedFormValues';
import { ExportFormatId } from '~/types/types';
import ExportOptions from './ExportOptions';
import ExportScenes from './ExportScenes';
import { ExportFormValues, exportFormSchema, PERSISTED_FIELDS } from './exportFormSchema';

const INVALID_FILENAME_CHARS = /[<>:"/\\|?*]/g;

function sanitizeFileName(value: string): string {
  return value.replace(INVALID_FILENAME_CHARS, '');
}

const NOTES: Record<ExportFormatId, string> = {
  ableton: `Please note that the exported project won't sound exactly the same as it does on the device.`,
  dawproject: `Unfortunately, the DAWproject format does not currently support the "Sampler" instrument, so you will need to manually assign the samples in your DAW.`,
  midi: `The simplest format supported by any DAW. But you have to assign the samples manually.`,
  reaper: `Only basic sampler features are supported`,
};

function ExportProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const projectId = useAtomValue(projectIdAtom);

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: EXPORT_FORMATS[0].value,
      projectName: `Project${projectId}`,
      includeArchivedSamples: true,
      exportAllSamples: false,
      clips: false,
      groupTracks: true,
      drumRackGroupA: false,
      drumRackGroupB: false,
      drumRackGroupC: false,
      drumRackGroupD: false,
      sendEffects: true,
      allScenes: true,
      selectedScenes: [],
    },
  });

  usePersistedFormValues(form, PERSISTED_FIELDS, exportFormSchema);

  const format = useWatch({ control: form.control, name: 'format' });
  const projectName = useWatch({ control: form.control, name: 'projectName' });
  const allScenes = useWatch({ control: form.control, name: 'allScenes' });
  const selectedScenes = useWatch({ control: form.control, name: 'selectedScenes' });
  const trimmedName = (projectName ?? '').trim();

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
    projectName: trimmedName,
    includeArchivedSamples: form.getValues('includeArchivedSamples'),
    exportAllSamples: form.getValues('exportAllSamples'),
    clips: form.getValues('clips'),
    groupTracks: form.getValues('groupTracks'),
    drumRackGroupA: form.getValues('drumRackGroupA'),
    drumRackGroupB: form.getValues('drumRackGroupB'),
    drumRackGroupC: form.getValues('drumRackGroupC'),
    drumRackGroupD: form.getValues('drumRackGroupD'),
    sendEffects: form.getValues('sendEffects'),
    allScenes: form.getValues('allScenes'),
    selectedScenes: form.getValues('selectedScenes'),
  });
  const [_, openFeedbackDialog] = useAtom(feedbackDialogAtom);

  const canExport = (allScenes || (selectedScenes?.length ?? 0) > 0) && trimmedName.length > 0;

  useEffect(() => {
    reset();
  }, [format]);

  return (
    <FormProvider {...form}>
      <Dialog isOpen={open} onClose={() => onOpenChange(false)} className="min-w-200">
        <div className="flex flex-col gap-2 min-w-150 max-w-175">
          <h3 className="text-lg font-semibold">Export</h3>
          <SelectField name="format" disabled={isPending} className="mr-auto mb-4">
            {EXPORT_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </SelectField>
          <h4 className="font-semibold">Project name</h4>
          <InputField
            name="projectName"
            disabled={isPending}
            className="w-100"
            placeholder="Enter project name"
            transform={sanitizeFileName}
          />
          <div className="flex gap-14 mt-2">
            <ExportOptions disabled={isPending} />
            <ExportScenes disabled={isPending} />
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
                Opps, that's not good. Hope the error tracking system helps me to find the problem.
                If you can, please submit an error report - it really helps me fix things faster.
                Thanks!
              </p>
              <div className="text-center mt-5"></div>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-5">
          <Button variant="secondary" className="mr-auto" onClick={() => openFeedbackDialog(true)}>
            Submit error report
          </Button>
          {isPending ? (
            <Button variant="secondary" onClick={cancelExport}>
              Cancel
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
          <Button onClick={startExport} disabled={isPending || !canExport} variant="primary">
            Export
          </Button>
        </div>
      </Dialog>
    </FormProvider>
  );
}

export default ExportProjectDialog;
