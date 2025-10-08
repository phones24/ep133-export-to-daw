import { ExporterParams, ExportResult, ExportStatus, ProjectRawData } from '../../../types/types';
import { AbortError } from '../../utils';

import { jsonToRppText, ReaperProject } from './reaperlib';

async function exportReaper(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  _exporterParams: ExporterParams,
  abortSignal: AbortSignal,
): Promise<ExportResult> {
  progressCallback({ progress: 1, status: 'Preparing REAPER export...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  // Map minimal fields from ProjectRawData to ReaperProjectJSON
  const bpm = data.settings?.bpm ?? 120;
  const pads = data.pads ?? {};
  const tracks = Object.keys(pads).map((groupKey) => ({
    name: `Group ${groupKey}`,
    items: [],
  }));

  const rproj: ReaperProject = {
    projectName: `Project ${projectId}`,
    tempo: bpm,
    ppq: 960,
    sampleRate: 44100,
    tracks,
  };

  const rppText = jsonToRppText(rproj);
  const blob = new Blob([rppText], { type: 'text/plain' });

  const files = [
    {
      name: `project-${projectId}.rpp`,
      url: URL.createObjectURL(blob),
      type: 'project' as const,
      size: blob.size,
    },
  ];

  progressCallback({ progress: 100, status: 'Done' });

  return { files } as ExportResult;
}

export default exportReaper;
