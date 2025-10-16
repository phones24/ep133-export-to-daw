import JSZip from 'jszip';
import {
  ExporterParams,
  ExportResult,
  ExportResultFile,
  ExportStatus,
  PadCode,
  ProjectRawData,
  SampleReport,
} from '../../../types/types';
import { RprTrack, reaperTransform } from '../../transformers/reaper';
import { AbortError } from '../../utils';
import { collectSamples, getQuarterNotesPerBar } from '../utils';
import { generateReaperProject, ReaperTrack } from './reaperlib';

function buildTrack(track: RprTrack): ReaperTrack {
  return {
    name: track.name,
    tempo: track.bpm,
    volume: track.volume,
    pan: track.pan,
    sample: track.sampleName
      ? {
          name: track.sampleName,
          rate: track.sampleRate,
          channels: track.sampleChannels,
          length: track.soundLength,
          timeStretch: track.timeStretch,
          timeStretchBars: track.timeStretchBars,
          timeStretchBpm: track.timeStretchBpm,
          trimLeft: track.trimLeft,
          trimRight: track.trimRight,
          rootNote: track.rootNote,
          attack: track.attack,
          release: track.release,
          playMode: track.playMode,
          pitch: track.pitch,
        }
      : null,
    timeSignature: track.timeSignature,
    guid: crypto.randomUUID().toUpperCase(),
    items: track.items.map((item) => ({
      position:
        (item.offset *
          getQuarterNotesPerBar(track.timeSignature.numerator, track.timeSignature.denominator) *
          60) /
        track.bpm,
      length:
        (item.sceneBars *
          getQuarterNotesPerBar(track.timeSignature.numerator, track.timeSignature.denominator) *
          60) /
        track.bpm,
      lengthInBars: item.bars,
      name: `Scene ${item.sceneName}`,
      events: item.notes.map((n) => ({
        note: n.note,
        position: n.position,
        length: n.duration,
        velocity: n.velocity,
      })),
    })),
  };
}

function buildReaperProject(
  data: ProjectRawData,
  projectId: string,
  exporterParams: ExporterParams,
) {
  const transformedData = reaperTransform(data);

  if (import.meta.env.DEV) {
    console.log(transformedData);
  }

  let tracks: ReaperTrack[];
  if (exporterParams.groupTracks) {
    const groupedTracks: ReaperTrack[] = [];

    ['a', 'b', 'c', 'd'].forEach((group) => {
      const groupTracks = transformedData.tracks.filter((t) => t.group === group);

      if (groupTracks.length) {
        groupedTracks.push({
          ...buildTrack({
            name: `Group ${group.toUpperCase()}`,
            timeSignature: data.scenesSettings.timeSignature,
            bpm: data.settings.bpm,
            volume: 1,
            pan: 0,
            sampleName: '',
            sampleChannels: 0,
            sampleRate: 0,
            soundLength: 0,
            attack: 0,
            release: 0,
            trimLeft: 0,
            trimRight: 0,
            rootNote: 60,
            timeStretch: 'off',
            timeStretchBpm: 0,
            timeStretchBars: 0,
            soundId: 0,
            inChokeGroup: false,
            playMode: 'oneshot',
            pitch: 0,
            items: [],
            pad: 0,
            padCode: `${group}0` as PadCode,
            group,
          }),

          tracks: groupTracks.map(buildTrack),
        });
      }
    });

    tracks = groupedTracks;
  } else {
    tracks = transformedData.tracks.map(buildTrack);
  }

  const rprContent = generateReaperProject(
    {
      projectName: `Project ${projectId}`,
      tempo: data.settings?.bpm ?? 120,
      timeSignature: data.scenesSettings.timeSignature,
      tracks,
    },
    exporterParams,
  );

  return rprContent;
}

async function exportReaper(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
): Promise<ExportResult> {
  let sampleReport: SampleReport | undefined;
  const files: ExportResultFile[] = [];
  const zippedProject = new JSZip();
  const projectName = `Project${projectId}`;

  progressCallback({ progress: 1, status: 'Preparing REAPER export...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const rprContent = buildReaperProject(data, projectId, exporterParams);

  zippedProject.file(`${projectName}/${projectName}.RPP`, rprContent);

  if (exporterParams.includeArchivedSamples) {
    const { samples, sampleReport: report } = await collectSamples(
      data,
      progressCallback,
      abortSignal,
    );
    samples.forEach((s) => {
      zippedProject.file(`${projectName}/Media/samples/${s.name}`, s.data);
    });
    sampleReport = report;
  }

  progressCallback({ progress: 90, status: 'Bundle everything...' });

  const zippedProjectFile = await zippedProject.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
  });

  if (import.meta.env.DEV) {
    const blob = new Blob([rprContent], { type: 'application/octet-stream' });
    files.push({
      name: `${projectName}.RPP`,
      url: URL.createObjectURL(blob),
      type: 'archive',
      size: blob.size,
    });
  }

  files.push({
    name: `${projectName}.zip`,
    url: URL.createObjectURL(zippedProjectFile),
    type: 'archive',
    size: zippedProjectFile.size,
  });

  progressCallback({ progress: 100, status: 'Done' });

  return { files, sampleReport };
}

export default exportReaper;
