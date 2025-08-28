import { useAtomValue } from 'jotai';
import { useState } from 'preact/hooks';
import { projectIdAtom } from '../atoms/project';
import exportDawProject from '../lib/exporters/dawProject';
import exportMidi from '../lib/exporters/midi';
import { trackEvent } from '../lib/ga';
import { ExportFormat, ExportFormatId, ExportResult } from '../types';
import useAllSounds from './useAllSounds';
import useDevice from './useDevice';
import useProject from './useProject';

export const exportFormats: ExportFormat[] = [
  {
    name: 'DAWproject + samples',
    value: 'dawproject',
    exportFn: exportDawProject,
  },
  {
    name: 'DAWproject (with clips) + samples',
    value: 'dawproject_with_clips',
    exportFn: exportDawProject,
  },
  {
    name: 'MIDI + samples',
    value: 'midi',
    exportFn: exportMidi,
  },
];

function useExportProject(format: ExportFormatId) {
  const projectId = useAtomValue(projectIdAtom);
  const { data: projectRawData } = useProject(projectId);
  const { data: allSounds } = useAllSounds();
  const [isPending, setIsPending] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<any>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const { deviceService } = useDevice();

  const startExport = async () => {
    trackEvent('export_start');

    try {
      const formatData = exportFormats.find((f) => f.value === format);

      if (!formatData || !projectRawData || !allSounds || !deviceService) {
        return;
      }

      setIsPending(true);
      setPercentage(1);

      const result = await formatData.exportFn(
        format,
        projectId,
        projectRawData,
        allSounds,
        deviceService,
        (stat) => {
          setPercentage(stat.progress);
          setPendingStatus(stat.status);
        },
      );

      setResult(result);
      setIsPending(false);

      trackEvent('export_end');
    } catch (err) {
      setError(err);

      trackEvent('export_error');
    }
  };

  const reset = () => {
    setError(null);
    setIsPending(false);
    setPercentage(0);
    setPendingStatus('');

    if (!result) {
      return;
    }

    for (const file of result.files) {
      URL.revokeObjectURL(file.url);
    }

    setResult(null);
  };

  return { startExport, reset, isPending, pendingStatus, percentage, result, error };
}

export default useExportProject;
