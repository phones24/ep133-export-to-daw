import * as Sentry from '@sentry/react';
import { useAtomValue } from 'jotai';
import { useState } from 'preact/hooks';
import { projectIdAtom } from '../atoms/project';
import { trackEvent } from '../lib/ga';
import { AbortError } from '../lib/utils';
import {
  ExporterParams,
  ExportFormat,
  ExportFormatId,
  ExportResult,
  ExportStatus,
  ProjectRawData,
  SampleReport,
} from '../types/types';
import useProject from './useProject';

export const EXPORT_FORMATS: ExportFormat[] = [
  {
    name: 'Ableton 11+',
    value: 'ableton',
  },
  {
    name: 'DAWproject',
    value: 'dawproject',
  },
  {
    name: 'MIDI',
    value: 'midi',
  },
  {
    name: 'REAPER',
    value: 'reaper',
  },
];

async function getExporterFn(
  format: ExportFormatId,
): Promise<
  (
    projectId: string,
    data: any,
    progressCallback: any,
    exporterParams: ExporterParams,
    abortSignal: AbortSignal,
  ) => Promise<any>
> {
  switch (format) {
    case 'ableton':
      return (await import('../lib/exporters/ableton')).default;
    case 'dawproject':
      return (await import('../lib/exporters/dawProject')).default;
    case 'midi':
      return (await import('../lib/exporters/midi')).default;
    case 'reaper':
      return (await import('../lib/exporters/reaper')).default;
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

function filterScenes(data: ProjectRawData, params: ExporterParams): ProjectRawData {
  if (params.allScenes) {
    return data;
  }
  return {
    ...data,
    scenes: data.scenes.filter((scene) => params.selectedScenes?.includes(scene.name)),
  };
}

function useExportProject(format: ExportFormatId, exporterParams: ExporterParams) {
  const projectId = useAtomValue(projectIdAtom);
  const { data: projectRawData } = useProject(projectId);
  const [isPending, setIsPending] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<any>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [sampleReport, setSampleReport] = useState<SampleReport | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const startExport = async () => {
    trackEvent('export_start', {
      format,
    });

    try {
      const formatData = EXPORT_FORMATS.find((f) => f.value === format);

      if (!formatData || !projectRawData) {
        return;
      }

      setPendingStatus('Starting export...');
      setError(null);
      setIsPending(true);
      setPercentage(1);

      const controller = new AbortController();
      setAbortController(controller);

      const exportFn = await getExporterFn(format);

      const filteredData = filterScenes(projectRawData, exporterParams);

      const result = await exportFn(
        projectId,
        filteredData,
        (stat: ExportStatus) => {
          setPercentage(stat.progress);
          setPendingStatus(stat.status);
        },
        exporterParams,
        controller.signal,
      );

      setResult(result);
      setSampleReport(result.sampleReport || null);
      setIsPending(false);
      setAbortController(null);

      trackEvent('export_end');
    } catch (err) {
      if (err instanceof AbortError) {
        setPendingStatus('Export cancelled');
        setIsPending(false);
        setAbortController(null);
        return;
      }

      console.error(err);

      Sentry.captureException(err);

      setError(err);
      setIsPending(false);
      setAbortController(null);

      trackEvent('export_error');
    }
  };

  const cancelExport = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const reset = () => {
    setError(null);
    setIsPending(false);
    setPercentage(0);
    setPendingStatus('');
    setSampleReport(null);

    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    if (!result) {
      return;
    }

    for (const file of result.files) {
      URL.revokeObjectURL(file.url);
    }

    setResult(null);
  };

  return {
    startExport,
    cancelExport,
    reset,
    isPending,
    pendingStatus,
    percentage,
    result,
    error,
    sampleReport,
  };
}

export default useExportProject;
