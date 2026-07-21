import * as Sentry from '@sentry/react';
import {
  ExporterParams,
  ExportResult,
  ExportStatus,
  Pad,
  PadCode,
  ProjectRawData,
  SampleReport,
  Sound,
} from '../../../types/types';
import { xmTransform } from '../../transformers/xm';
import { AbortError, findPad } from '../../utils';
import { downloadPcm, getSampleName } from '../utils';
import { PreparedXmInstrument, prepareXmInstrument } from './samples';
import { XmModule } from './types';
import { serializeXm } from './writer';

type PadEntry = {
  padCode: PadCode;
  pad: Pad;
  sound?: Sound;
};

function chooseXmTempo(projectBpm: number) {
  const candidates: Array<{ speed: number; bpm: number; actualBpm: number; error: number }> = [];
  for (let speed = 1; speed <= 16; speed++) {
    const bpm = Math.round((projectBpm * speed) / 6);
    if (bpm < 32 || bpm > 255) {
      continue;
    }
    const actualBpm = (6 * bpm) / speed;
    candidates.push({ speed, bpm, actualBpm, error: Math.abs(actualBpm - projectBpm) });
  }

  candidates.sort((a, b) => a.error - b.error || Math.abs(a.speed - 6) - Math.abs(b.speed - 6));
  const tempo = candidates[0];
  if (!tempo) {
    throw new Error(`Project BPM ${projectBpm} cannot be represented by FastTracker 2`);
  }
  return tempo;
}

function collectPadEntries(data: ProjectRawData, includeAllPads: boolean) {
  const padCodes = new Set<PadCode>();
  for (const scene of data.scenes) {
    for (const pattern of scene.patterns) {
      if (pattern.notes.length > 0) {
        padCodes.add(pattern.pad);
      }
    }
  }

  if (includeAllPads) {
    for (const [group, pads] of Object.entries(data.pads)) {
      pads.forEach((pad, index) => {
        if (pad.soundId > 0) {
          padCodes.add(`${group}${index}` as PadCode);
        }
      });
    }
  }

  return [...padCodes]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map<PadEntry>((padCode) => {
      const pad = findPad(padCode, data.pads);
      if (!pad) {
        throw new Error(`Could not find pad data for ${padCode}`);
      }
      return {
        padCode,
        pad,
        sound: data.sounds.find((sound) => sound.id === pad.soundId),
      };
    });
}

async function downloadSounds(
  entries: PadEntry[],
  progressCallback: (status: ExportStatus) => void,
  abortSignal: AbortSignal,
) {
  const sounds = new Map<number, Sound>();
  for (const entry of entries) {
    if (entry.sound) {
      sounds.set(entry.sound.id, entry.sound);
    }
  }

  const pcmBySound = new Map<number, Uint8Array>();
  const downloaded: string[] = [];
  const missing: SampleReport['missing'] = [];
  const soundList = [...sounds.values()];

  for (let index = 0; index < soundList.length; index++) {
    if (abortSignal.aborted) {
      throw new AbortError();
    }

    const sound = soundList[index];
    const name = getSampleName(sound.meta.name, sound.id);
    progressCallback({
      progress: 5 + (index / Math.max(1, soundList.length)) * 65,
      status: `Downloading sound: ${name}`,
    });

    try {
      const pcm = await downloadPcm(sound.id, (bytesRead, totalRemaining) => {
        if (abortSignal.aborted) {
          throw new AbortError();
        }
        const soundProgress = totalRemaining > 0 ? Math.min(1, bytesRead / totalRemaining) : 0;
        progressCallback({
          progress: 5 + ((index + soundProgress) / Math.max(1, soundList.length)) * 65,
          status: `Downloading sound: ${name}`,
        });
      });
      pcmBySound.set(sound.id, pcm);
      downloaded.push(name);
    } catch (error) {
      if (error instanceof AbortError || abortSignal.aborted) {
        throw new AbortError();
      }
      console.error(error);
      Sentry.captureException(error);
      missing.push({
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { pcmBySound, sampleReport: { downloaded, missing } };
}

function prepareInstruments(
  entries: PadEntry[],
  pcmBySound: Map<number, Uint8Array>,
  data: ProjectRawData,
  bpm: number,
  sampleReport: SampleReport,
) {
  const instruments = new Map<string, PreparedXmInstrument>();

  for (const entry of entries) {
    if (!entry.sound) {
      continue;
    }

    const pcm = pcmBySound.get(entry.sound.id);
    if (!pcm) {
      continue;
    }

    try {
      const prepared = prepareXmInstrument({
        padCode: entry.padCode,
        number: instruments.size + 1,
        pad: entry.pad,
        sound: entry.sound,
        pcm,
        faders: data.settings.groupFaderParams[entry.pad.group],
        bpm,
        timeSignature: data.scenesSettings.timeSignature,
      });
      instruments.set(entry.padCode, prepared);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      sampleReport.missing.push({
        name: `${entry.padCode.toUpperCase()} ${entry.sound.meta.name}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return instruments;
}

async function exportXm(
  projectId: string,
  data: ProjectRawData,
  progressCallback: (status: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
): Promise<ExportResult> {
  progressCallback({ progress: 1, status: 'Preparing FastTracker 2 export...' });
  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const tempo = chooseXmTempo(data.settings.bpm);

  const entries = collectPadEntries(data, Boolean(exporterParams.exportAllPadsWithSamples));
  const { pcmBySound, sampleReport } = await downloadSounds(entries, progressCallback, abortSignal);
  progressCallback({ progress: 72, status: 'Converting samples for FastTracker 2...' });

  const instruments = prepareInstruments(entries, pcmBySound, data, tempo.bpm, sampleReport);
  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const sequence = xmTransform({ data, instruments, speed: tempo.speed, bpm: tempo.bpm });

  progressCallback({ progress: 90, status: 'Writing XM module...' });
  const projectName = exporterParams.projectName || `Project${projectId}`;
  const module: XmModule = {
    name: projectName,
    trackerName: 'EP133 to DAW',
    channels: sequence.channels,
    speed: tempo.speed,
    bpm: tempo.bpm,
    patterns: sequence.patterns,
    instruments: [...instruments.values()].map((instrument) => instrument.instrument),
  };
  const blob = serializeXm(module);
  const fileName = `${projectName}.xm`;

  progressCallback({ progress: 100, status: 'Done' });
  return {
    files: [
      {
        name: fileName,
        url: URL.createObjectURL(blob),
        type: 'project',
        size: blob.size,
      },
    ],
    sampleReport,
  };
}

export { chooseXmTempo };
export default exportXm;
