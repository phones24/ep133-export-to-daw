import {
  GroupFaderParam,
  Note,
  Pad,
  PadCode,
  Pattern,
  ProjectSettings,
  Scene,
  ScenesSettings,
  Sound,
} from '../types/types';
import { GROUPS, PADS } from './constants';
import { getFileMetadata, getFileNodeByPath } from './midi/fs';
import { TESoundMetadata } from './midi/types';
import { TarFile } from './untar';
import { calculateSoundLength } from './utils';

const defaultProjectSettings = {
  bpm: 120,
  groupFaderParams: {
    a: { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1, 11: -1 },
    b: { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1, 11: -1 },
    c: { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1, 11: -1 },
    d: { 0: -1, 1: -1, 2: -1, 3: -1, 4: -1, 5: -1, 6: -1, 7: -1, 8: -1, 9: -1, 10: -1, 11: -1 },
  },
  faderAssignment: { a: 0, b: 0, c: 0, d: 0 },
};

const defaultScenesSettings = {
  timeSignature: { numerator: 4, denominator: 4 },
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
      return 1;
    case 1:
      return 2;
    case 2:
      return 4;
    case 255:
      return 0.5;
    case 254:
      return 0.25;
    default:
      return 0;
  }
}

function bytesToFloat32(bytes: Uint8Array): number {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);

  bytes.forEach((b, i) => {
    view.setUint8(i, b);
  });

  return view.getFloat32(0, true);
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

export async function collectSounds(files: TarFile[]) {
  const soundIds = new Set<number>();

  for (let g = 0; g < 4; g++) {
    for (let i = 1; i <= 12; i++) {
      const file = files.find((f) => f.name === genPadFileName(GROUPS[g].id, i));

      if (file?.data) {
        const soundId = (file.data[2] << 8) + file.data[1];
        if (soundId > 0) {
          soundIds.add(soundId);
        }
      }
    }
  }

  const selectedSounds: Sound[] = [];

  for (const soundId of soundIds) {
    const fileNode = await getFileNodeByPath(`/sounds/${String(soundId).padStart(3, '0')}.pcm`);

    if (!fileNode) {
      console.warn(`Sound file for sound ID ${soundId} not found`);
      continue;
    }

    const meta = await getFileMetadata<TESoundMetadata>(fileNode.nodeId);

    selectedSounds.push({
      id: soundId,
      fileNode,
      meta,
    });
  }

  return selectedSounds;
}

export function collectPads(files: TarFile[], sounds: Sound[]) {
  const result: Record<string, Pad[]> = {};

  for (const group of GROUPS) {
    result[group.id] = [];

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

        result[group.id].push({
          pad: i,
          group: group.id,
          name: `${group.name} ${PADS[i - 1]}`,
          file,
          rawData: file.data,
          soundId,
          pan,
          volume: file.data[16],
          attack: file.data[19],
          release: file.data[20],
          trimLeft,
          trimRight,
          playMode: file.data[23] === 0 ? 'oneshot' : file.data[23] === 1 ? 'key' : 'legato',
          soundLength: sound ? calculateSoundLength(sound) : 0,
          pitch: Math.max(-12, Math.min(12, parseFloat(`${pitch}.${pitchDecimal}`))),
          rootNote: sound?.meta?.['sound.rootnote'] ?? 60,
          timeStretch: file.data[21] === 1 ? 'bpm' : file.data[21] === 2 ? 'bars' : 'off',
          timeStretchBpm: Number(bytesToFloat32(file.data.slice(12, 16)).toFixed(2)),
          timeStretchBars: timeStretchBars(file.data[25]),
          inChokeGroup: file.data[22] === 1,
          midiChannel: file.data[3],
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
    group,
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
        name: String(scene).padStart(2, '0'),
        patterns: [],
      };
    }

    scenes[scene].patterns = [...scenes[scene].patterns, ...parsePatterns(file.data, group)];
  }

  return Object.values(scenes).sort((a, b) => a.name.localeCompare(b.name));
}

export function collectSettings(files: TarFile[]): ProjectSettings {
  const settings = files.find((f) => f.name === 'settings' && f.type === 'file');

  if (!settings || !settings.data) {
    console.error('Could not find settings file');

    return {
      ...defaultProjectSettings,
      rawData: new Uint8Array(),
    };
  }

  const faderParamsData: GroupFaderParam = {};

  for (const groupNum of [0, 1, 2, 3]) {
    const groupId = GROUPS[groupNum].id;
    for (let paramNum = 0; paramNum <= 11; paramNum++) {
      faderParamsData[groupId] = {
        ...faderParamsData[groupId],
        [paramNum]: Number(
          bytesToFloat32(
            settings.data.slice(
              24 + groupNum * 48 + paramNum * 4,
              28 + groupNum * 48 + paramNum * 4,
            ),
          ).toFixed(2),
        ),
      };
    }
  }

  return {
    bpm: Number(bytesToFloat32(settings.data.slice(4, 8)).toFixed(2)),
    groupFaderParams: faderParamsData,
    faderAssignment: {
      a: settings.data[216],
      b: settings.data[217],
      c: settings.data[218],
      d: settings.data[219],
    },
    rawData: settings.data,
  };
}

export function collectEffects(files: TarFile[]) {
  const fxFile = files.find((f) => f.name === 'fx_settings' && f.type === 'file');

  if (!fxFile || !fxFile.data) {
    console.error('Could not find fx file');

    return {
      rawData: new Uint8Array(),
      effectType: 0,
      param1: 0,
      param2: 0,
    };
  }

  const effectType = fxFile.data[4];
  const param1 = bytesToFloat32(
    fxFile.data.slice(12 + (effectType - 1) * 4, 16 + (effectType - 1) * 4),
  );
  const param2 = bytesToFloat32(
    fxFile.data.slice(76 + (effectType - 1) * 4, 80 + (effectType - 1) * 4),
  );

  return {
    rawData: fxFile.data,
    effectType,
    param1,
    param2,
  };
}

export function collectScenesSettings(files: TarFile[]): ScenesSettings {
  const scenesSettingsFile = files.find((f) => f.name === 'scenes' && f.type === 'file');

  if (!scenesSettingsFile || !scenesSettingsFile.data) {
    console.error('Could not find scenes settings file');
    return defaultScenesSettings;
  }

  const numerator = scenesSettingsFile.data[11];
  const denominator = scenesSettingsFile.data[12];

  return {
    ...defaultScenesSettings,
    timeSignature: { numerator, denominator },
  };
}
