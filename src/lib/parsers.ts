import { TarFile } from './untar';

export type Pattern = {
  pad: string;
  notes: Note[];
  bars: number;
};

export type Scene = {
  name: string;
  patterns: Pattern[];
};

export type Note = {
  note: number;
  position: number;
  duration: number;
  velocity: number;
};

export type Pad = {
  pad: number;
  name: string;
  file: TarFile;
  rawData: Uint8Array;
  soundNumber: number;
  panning?: number;
  volume?: number;
};

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

export function noteNumberToName(noteNumber: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;

  return `${noteNames[noteIndex]}${octave}`;
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

export function collectPads(files: TarFile[]) {
  const result: Record<string, Pad[]> = {};

  for (const group of GROUPS) {
    const grp = group.name.toLocaleLowerCase();

    result[grp] = [];

    for (let i = 1; i <= 12; i++) {
      const file = files.find((f) => f.name === genPadFileName(group.id, i));
      if (file?.data) {
        result[grp].push({
          pad: i,
          name: PADS[i - 1],
          file,
          rawData: file.data,
          soundNumber: (file.data[2] << 8) + file.data[1],
          volume: file.data[16],
        });
      }
    }
  }

  return result;
}

export function parsePatterns(data: Uint8Array, group: string) {
  const chunks = chunkArray(data, 8, 4);
  const notes: Record<string, Note[]> = {};

  chunks.forEach((chunk) => {
    const pad = String(chunk[2] / 8);
    const patternName = `${group}${pad}`;

    if (!notes[patternName]) {
      notes[patternName] = [];
    }

    const position = (chunk[1] << 8) + chunk[0];
    notes[patternName].push({
      position,
      note: chunk[3],
      velocity: chunk[4],
      duration: chunk[5],
    });
  });

  return Object.entries(notes).map(([pad, notes]) => ({
    pad,
    notes,
    bars: data[1],
  }));
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
