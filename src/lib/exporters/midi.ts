import { Midi } from '@tonejs/midi';
import JSZip from 'jszip';
import {
  ExporterParams,
  ExportResult,
  ExportStatus,
  ProjectRawData,
  SampleReport,
} from '../../types/types';
import midiTransformer from '../transformers/midi';
import { AbortError } from '../utils';
import { collectSamples } from './utils';

const UNITS_PER_BEAT = 96; // (384 / 4 beats)

function unitsToTicks(units: number, ppq = 480) {
  return Math.round((units / UNITS_PER_BEAT) * ppq);
}

async function exportMidi(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
) {
  progressCallback({ progress: 1, status: 'Exporting project data...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const transformedData = midiTransformer(data);
  const midi = new Midi();

  midi.header.setTempo(data.settings.bpm);

  transformedData.tracks.forEach((track) => {
    const midiTrack = midi.addTrack();

    midiTrack.name = track.name;
    midiTrack.channel = 0;

    track.notes.forEach((note) => {
      midiTrack.addNote({
        ticks: unitsToTicks(note.position, midi.header.ppq),
        durationTicks: unitsToTicks(note.duration, midi.header.ppq),
        velocity: Math.max(0, Math.min(1, note.velocity / 127)),
        midi: note.note + 12,
      });
    });
  });

  // @ts-expect-error wrong typing?
  const midiBlob = new Blob([midi.toArray()], { type: 'audio/midi' });

  const files: Array<{
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }> = [
    {
      name: `project${projectId}.mid`,
      url: URL.createObjectURL(midiBlob),
      type: 'project',
      size: midiBlob.size,
    },
  ];

  let sampleReport: SampleReport | undefined;

  if (exporterParams.includeArchivedSamples) {
    const zipSamples = new JSZip();
    const { samples, sampleReport: report } = await collectSamples(
      data,
      progressCallback,
      abortSignal,
    );

    samples.forEach((s) => {
      zipSamples.file(s.name, s.data);
    });

    progressCallback({ progress: 90, status: 'Bundle samples...' });

    const sampleFile = await zipSamples.generateAsync({ type: 'blob' });

    files.push({
      name: `project${projectId}_samples.zip`,
      url: URL.createObjectURL(sampleFile),
      type: 'archive',
      size: sampleFile.size,
    });

    sampleReport = report;
  }

  progressCallback({ progress: 100, status: 'Done' });

  return {
    files,
    sampleReport,
  } as ExportResult;
}

export default exportMidi;
