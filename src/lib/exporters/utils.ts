import * as Sentry from '@sentry/react';
import { ExportStatus, ProjectRawData, SoundInfo } from '../../types/types';
import { getFile, getFileNodeByPath } from '../midi/fs';
import { pcmToWavBlob } from '../pcmToWav';
import { AbortError, audioFormatAsBitDepth } from '../utils';

let _colorIndex = 0;

export const UNITS_PER_BEAT = 96; // (384 / 4 beats)
const COLORS = [
  '#B2B0E8',
  '#E27D60',
  '#26A693',
  '#E8A87C',
  '#85C1A9',
  '#C38D9E',
  '#41B3A3',
  '#F2B880',
  '#7DAF9C',
  '#F47261',
  '#9D6A89',
  '#5AA9A4',
  '#7A2A80',
  '#8FB996',
  '#47B267',
  '#B089A3',
  '#6CA6A3',
  '#A0C4B0',
  '#F5A97F',
  '#BBA0C0',
  '#79B2B2',
];

export async function downloadPcm(
  soundId: number,
  progressCallback?: (bytesRead: number, totalRemaining: number) => void,
) {
  const fileNode = await getFileNodeByPath(`/sounds/${String(soundId).padStart(3, '0')}.pcm`);

  if (!fileNode) {
    throw new Error(`Sound file for sound ID ${soundId} not found`);
  }

  const fileData = await getFile(fileNode.nodeId, progressCallback);

  return fileData.data;
}

export function getSampleName(name: string | undefined, soundId: number, extension = true) {
  if (soundId === 0 && !name) {
    return '';
  }

  const id = soundId.toString().padStart(3, '0');
  const n = name ? `${id} ${name}` : `${id} sample`;

  return extension ? `${n}.wav` : n;
}

function getSoundsInfoFromProject(data: ProjectRawData) {
  const snds: SoundInfo[] = [];
  const existingSounds = new Set<number>();

  for (const group in data.pads) {
    for (const pad of data.pads[group]) {
      if (existingSounds.has(pad.soundId)) {
        continue;
      }

      const soundMeta = data.sounds.find((s) => s.id === pad.soundId);

      if (!soundMeta) {
        continue;
      }

      if (pad.soundId > 0) {
        snds.push({
          soundId: pad.soundId,
          soundMeta: soundMeta.meta,
        });

        existingSounds.add(pad.soundId);
      }
    }
  }

  return snds;
}

export async function collectSamples(
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  abortSignal: AbortSignal,
) {
  const projectSounds = getSoundsInfoFromProject(data);

  const samples: { name: string; data: Blob }[] = [];
  const downloaded: string[] = [];
  const missing: { name: string; error: string }[] = [];
  const percentStart = 3;
  const percentPerSound = 80 / projectSounds.length;
  let cnt = 0;

  for (const snd of projectSounds) {
    if (abortSignal.aborted) {
      throw new AbortError();
    }

    const fileName = getSampleName(snd.soundMeta.name, snd.soundId);

    try {
      progressCallback({
        progress: percentStart + percentPerSound * cnt,
        status: `Downloading sound: ${fileName}`,
      });

      const result = await downloadPcm(snd.soundId, (bytesRead, totalRemaining) => {
        if (abortSignal.aborted) {
          throw new AbortError();
        }

        const currentSoundProgress = bytesRead / (totalRemaining / percentPerSound);
        progressCallback({
          progress: percentStart + percentPerSound * cnt + currentSoundProgress,
          status: `Downloading sound: ${fileName}`,
        });
      });

      const wavBlob = pcmToWavBlob(
        result,
        snd.soundMeta.samplerate,
        audioFormatAsBitDepth(snd.soundMeta.format),
        snd.soundMeta.channels,
      );

      samples.push({
        name: fileName,
        data: wavBlob,
      });

      downloaded.push(fileName);
    } catch (err) {
      // only report when not aborted
      if (!abortSignal.aborted) {
        console.error(err);
        Sentry.captureException(err);
      }

      missing.push({
        name: fileName,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      cnt++;
    }
  }

  const sampleReport = { downloaded, missing };

  progressCallback({
    progress: percentStart + percentPerSound * cnt,
    status: 'Sample collection completed',
    sampleReport,
  });

  return { samples, sampleReport };
}

export function getNextColor() {
  const color = COLORS[_colorIndex];
  _colorIndex = (_colorIndex + 1) % COLORS.length;
  return color;
}

export function unitsToTicks(units: number, ppq = 480) {
  return Math.round((units / UNITS_PER_BEAT) * ppq);
}
