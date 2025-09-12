import * as Sentry from '@sentry/react';
import { useAtomValue } from 'jotai';
import { useState } from 'preact/hooks';
import { projectIdAtom } from '../atoms/project';
import exportAbleton from '../lib/exporters/ableton';
import exportDawProject from '../lib/exporters/dawProject';
import exportMidi from '../lib/exporters/midi';
import { trackEvent } from '../lib/ga';
import {
  ExporterParams,
  ExportFormat,
  ExportFormatId,
  ExportResult,
  SampleReport,
} from '../types/types';
import useAllSounds from './useAllSounds';
import useDevice from './useDevice';
import useProject from './useProject';

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    name: 'Ableton 11+',
    value: 'ableton',
    exportFn: exportAbleton,
  },
  {
    name: 'DAWproject',
    value: 'dawproject',
    exportFn: exportDawProject,
  },
  {
    name: 'MIDI',
    value: 'midi',
    exportFn: exportMidi,
  },
];

function useExportProject(format: ExportFormatId, exporterParams: ExporterParams) {
  const projectId = useAtomValue(projectIdAtom);
  const { data: projectRawData } = useProject(projectId);
  const { data: allSounds } = useAllSounds();
  const [isPending, setIsPending] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<any>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [sampleReport, setSampleReport] = useState<SampleReport | null>(null);
  const { deviceService } = useDevice();

  const startExport = async () => {
    trackEvent('export_start', {
      format,
    });

    try {
      const formatData = EXPORT_FORMATS.find((f) => f.value === format);

      if (!formatData || !projectRawData || !allSounds || !deviceService) {
        return;
      }

      setError(null);
      setIsPending(true);
      setPercentage(1);

      const result = await formatData.exportFn(
        projectId,
        projectRawData,
        allSounds,
        deviceService,
        (stat) => {
          setPercentage(stat.progress);
          setPendingStatus(stat.status);
        },
        exporterParams,
      );

      setResult(result);
      setSampleReport(result.sampleReport || null);
      setIsPending(false);

      trackEvent('export_end');
    } catch (err) {
      console.error(err);

      Sentry.captureException(err);

      setError(err);
      setIsPending(false);

      trackEvent('export_error');
    }
  };

  const reset = () => {
    setError(null);
    setIsPending(false);
    setPercentage(0);
    setPendingStatus('');
    setSampleReport(null);

    if (!result) {
      return;
    }

    for (const file of result.files) {
      URL.revokeObjectURL(file.url);
    }

    setResult(null);
  };

  return { startExport, reset, isPending, pendingStatus, percentage, result, error, sampleReport };
}

export default useExportProject;
