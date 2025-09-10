import * as Sentry from '@sentry/react';
import { DeviceService } from '../../ep133/device-service';
import { ExportStatus, ProjectRawData, Sound } from '../../types/types';
import { pcmToWavBlob } from '../pcmToWav';
import { audioFormatAsBitDepth, getSoundsInfoFromProject } from '../utils';

export async function downloadPcm(
  soundId: number,
  deviceService: DeviceService,
  progressCallback?: (bytesRead: number, totalRemaining: number) => void,
) {
  const path = `/sounds/${String(soundId).padStart(3, '0')}.pcm`;

  const nodeId = await deviceService.getNodeIdByPath(path);
  const fileData = await deviceService.get(deviceService.device.serial, nodeId, progressCallback);
  const length = fileData.data.reduce((acc: number, buf: Uint8Array) => acc + buf.length, 0);
  const combined = new Uint8Array(length);
  let offset = 0;

  for (const buf of fileData.data) {
    combined.set(buf, offset);
    offset += buf.length;
  }

  return combined;
}

export function getSampleName(name: string | undefined, soundId: number, extension = true) {
  if (soundId === 0 && !name) {
    return '';
  }

  const id = soundId.toString().padStart(3, '0');
  const n = name ? `${id} ${name}` : `${id} sample`;

  return extension ? `${n}.wav` : n;
}

export async function collectSamples(
  data: ProjectRawData,
  sounds: Sound[],
  deviceService: DeviceService,
  progressCallback: ({ progress, status }: ExportStatus) => void,
) {
  const projectSounds = getSoundsInfoFromProject(data, sounds);

  const samples: { name: string; data: Blob }[] = [];
  const downloaded: string[] = [];
  const missing: { name: string; error: string }[] = [];
  const percentStart = 3;
  const percentPerSound = 80 / projectSounds.length;
  let cnt = 0;

  for (const snd of projectSounds) {
    const fileName = getSampleName(snd.soundMeta.name, snd.soundId);

    try {
      progressCallback({
        progress: percentStart + percentPerSound * cnt,
        status: `Downloading sound: ${fileName}`,
      });

      const result = await downloadPcm(snd.soundId, deviceService, (bytesRead, totalRemaining) => {
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
      console.error(err);

      Sentry.captureException(err);

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
