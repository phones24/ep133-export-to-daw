import { Pad, ProjectRawData, Sound, SoundInfo } from '../types/types';

let _colorIndex = 0;

const colors = [
  '#E27D60',
  '#85C1A9',
  '#E8A87C',
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
  '#B2B0E8',
  '#A0C4B0',
  '#F5A97F',
  '#BBA0C0',
  '#79B2B2',
];

export function getNextColor() {
  const color = colors[_colorIndex];
  _colorIndex = (_colorIndex + 1) % colors.length;
  return color;
}

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

export function getSoundsInfoFromProject(data: ProjectRawData, sounds: Sound[]) {
  const snds: SoundInfo[] = [];
  const existingSounds = new Set<number>();

  for (const group in data.pads) {
    for (const pad of data.pads[group]) {
      if (existingSounds.has(pad.soundId)) {
        continue;
      }

      const soundMeta = sounds.find((s) => s.id === pad.soundId);

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

export class AbortError extends Error {
  constructor() {
    super('The operation was aborted.');
    this.name = 'AbortError';
  }
}
