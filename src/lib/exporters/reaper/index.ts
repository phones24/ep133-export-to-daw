import { ExporterParams, ExportResult, ExportStatus, ProjectRawData } from '../../../types/types';
import { reaperTransform } from '../../transformers/reaper';
import { AbortError } from '../../utils';

import { generateReaperProject } from './reaperlib';

function buildReaperProject(
  data: ProjectRawData,
  projectId: string,
  exporterParams: ExporterParams,
) {
  const transformedData = reaperTransform(data, exporterParams);

  if (import.meta.env.DEV) {
    console.log(transformedData);
  }

  const rprContent = generateReaperProject({
    projectName: `Project ${projectId}`,
    tempo: data.settings?.bpm ?? 120,
    tracks: transformedData.tracks.map((t) => ({
      name: t.name,
      tempo: t.bpm,
      volume: t.volume,
      pan: t.pan,
      sample: t.sampleName
        ? {
            name: t.sampleName,
            rate: t.sampleRate,
            channels: t.sampleChannels,
            length: t.soundLength,
            timeStretch: t.timeStretch,
            timeStretchBars: t.timeStretchBars,
            timeStretchBpm: t.timeStretchBpm,
            trimLeft: t.trimLeft,
            trimRight: t.trimRight,
            rootNote: t.rootNote,
            attack: t.attack,
            release: t.release,
            playMode: t.playMode,
            pitch: t.pitch,
          }
        : null,
      guid: crypto.randomUUID().toUpperCase(),
      items: t.items.map((item) => ({
        position: (item.offset * 4 * 60) / t.bpm,
        length: (item.sceneBars * 4 * 60) / t.bpm,
        lengthInBars: item.bars,
        name: `Scene ${item.sceneName}`,
        events: item.notes.map((n) => ({
          note: n.note,
          position: n.position,
          length: n.duration,
          velocity: n.velocity,
        })),
      })),
    })),
  });

  return rprContent;
}

async function exportReaper(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
): Promise<ExportResult> {
  progressCallback({ progress: 1, status: 'Preparing REAPER export...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const rprContent = buildReaperProject(data, projectId, exporterParams);

  const blob = new Blob([rprContent], { type: 'text/plain' });

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
