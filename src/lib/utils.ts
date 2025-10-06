import { Pad, Sound } from '../types/types';

export function findPad(pad: string, pads: Record<string, Pad[]>) {
  const group = pad[0];
  const padNumber = parseInt(pad.slice(1), 10);
  const padData = pads[group][padNumber];

  return padData;
}

export function findSoundIdByPad(pad: string, pads: Record<string, Pad[]>) {
  const padData = findPad(pad, pads);

  if (!padData) {
    return null;
  }

  if (padData.soundId === 0) {
    return null;
  }

  return padData.soundId;
}

export function findSoundByPad(pad: string, pads: Record<string, Pad[]>, sounds: Sound[]) {
  const soundId = findSoundIdByPad(pad, pads);

  return sounds.find((s) => s.id === soundId) || null;
}

export function audioFormatAsBitDepth(s: string) {
  switch (s) {
    case 's16':
      return 16;
    case 's24':
      return 24;
    case 'float':
      return 32;
    default:
      throw new Error('unknown bit depth');
  }
}

export function calculateSoundLength(sound: Sound) {
  const sampleRate = sound.meta?.samplerate;
  const channels = sound.meta?.channels;
  const fileSize = sound.fileNode?.fileSize;

  if (!sampleRate || !channels || !fileSize) {
    return 0;
  }

  return fileSize / 2 / sampleRate / channels;
}

export class AbortError extends Error {
  constructor() {
    super('The operation was aborted.');
    this.name = 'AbortError';
  }
}
