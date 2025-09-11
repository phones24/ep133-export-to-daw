import { calculateSoundLength } from '../ep133/utils';
import { Note, Pad, PadCode, Pattern, ProjectSettings, Scene, Sound } from '../types/types';
import { TarFile } from './untar';

const GROUPS = [
  {
    name: 'A',
    id: 'a',
  },
  {
    name: 'B',
    id: 'b',
  },
  {
    name: 'C',
    id: 'c',
  },
  {
    name: 'D',
    id: 'd',
  },
];

const PADS = ['9', '8', '7', '6', '5', '4', '3', '2', '1', '.', '0', 'E'];

const defaultSettings = {
  bpm: 120,
};

export function noteNumberToName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;

  return `${noteNames[noteIndex]}${octave}`;
}

function timeStretchBars(data: number) {
  switch (data) {
    case 0:
      return '1bar';
    case 1:
      return '2bars';
    case 2:
      return '4bars';
    case 255:
      return '1/2bar';
    case 254:
      return '1/4bar';
    default:
      return '';
  }
}

function genPadFileName(group: string, pad: number) {
  return `pads/${group}/p${String(pad).padStart(2, '0')}`;
}

function chunkArray(arr: Uint8Array, size: number, offset = 0) {
  const result = [];

  for (let i = offset; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export function collectPads(files: TarFile[], sounds: Sound[]) {
  const result: Record<string, Pad[]> = {};

  for (const group of GROUPS) {
    const grp = group.name.toLocaleLowerCase();

    result[grp] = [];

    for (let i = 1; i <= 12; i++) {
      const file = files.find((f) => f.name === genPadFileName(group.id, i));

      if (file?.data) {
        const soundId = (file.data[2] << 8) + file.data[1];
        const sound = sounds.find((s) => s.id === soundId);
        const pitch = file.data[17] <= 12 ? file.data[17] : -(256 - file.data[17]); // pitch from -12 to +12
        const pitchDecimal = file.data[26];
        const pan = (file.data[18] >= 240 ? -(256 - file.data[18]) : file.data[18]) / 16; // normalized pan
        const trimLeft = (file.data[6] << 16) + (file.data[5] << 8) + file.data[4];
        const trimRight = trimLeft + (file.data[10] << 16) + (file.data[9] << 8) + file.data[8];

        result[grp].push({
          pad: i,
          name: `${grp.toUpperCase()} ${PADS[i - 1]}`,
          file,
          rawData: file.data,
          soundId,
          pan,
          volume: file.data[16],
          attack: file.data[19],
          release: file.data[20],
          trimLeft,
          trimRight,
          soundLength: sound ? calculateSoundLength(sound) : 0,
          pitch: Math.max(-12, Math.min(12, parseFloat(`${pitch}.${pitchDecimal}`))),
          rootNote: sound?.meta?.['sound.rootnote'] || 60,
          timeStretch: file.data[21] === 1 ? 'bpm' : file.data[21] === 2 ? 'bars' : 'off',
          timeStretchBpm: Number(bytesToFloat32(file.data.slice(12, 16)).toFixed(2)),
          timeStretchBars: timeStretchBars(file.data[25]),
        });
      }
    }
  }

  return result;
}

export function parsePatterns(data: Uint8Array, group: string) {
  const chunks = chunkArray(data, 8, 4);
  const notes: Record<PadCode, Note[]> = {};

  chunks.forEach((chunk) => {
    const pad = String(chunk[2] / 8);
    const patternName = `${group}${pad}` as PadCode;

    if (!notes[patternName]) {
      notes[patternName] = [];
    }

    notes[patternName].push({
      note: chunk[3],
      position: (chunk[1] << 8) + chunk[0],
      duration: (chunk[6] << 8) + chunk[5],
      velocity: chunk[4],
    });
  });

  return Object.entries(notes).map(([pad, notes]) => ({
    pad,
    notes,
    bars: data[1],
  })) as Pattern[];
}

export function collectScenesAndPatterns(files: TarFile[]) {
  const scenes: Record<string, Scene> = {};

  for (const file of files) {
    if (!file.name.startsWith('patterns') || file.type !== 'file' || !file.data) {
      continue;
    }

    const matches = file.name.match(/patterns\/([abcd])(\d+)/);
    if (!matches) {
      continue;
    }

    const [, group, scene] = matches;
    if (!scenes[scene]) {
      scenes[scene] = {
        name: scene,
        patterns: [],
      };
    }

    scenes[scene].patterns = [...scenes[scene].patterns, ...parsePatterns(file.data, group)];
  }

  return scenes;
}

function bytesToFloat32(bytes: Uint8Array): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  bytes.forEach((b, i) => {
    view.setUint8(i, b);
  });

  return view.getFloat32(0, true);
}

export function collectSettings(files: TarFile[]): ProjectSettings {
  const settings = files.find((f) => f.name === 'settings' && f.type === 'file');

  if (!settings || !settings.data) {
    console.error('Could not find settings file');

    return defaultSettings;
  }

  return {
    bpm: Number(bytesToFloat32(settings.data.slice(4, 8)).toFixed(2)),
  };
}
