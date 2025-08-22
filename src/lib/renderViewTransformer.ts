import { Sound } from '../hooks/useAllSounds';
import { ProjectRawData } from '../hooks/useProject';
import { Note, Pad, Pattern } from './parsers';

export type ViewPattern = {
  pad: string;
  bars: number;
  maxLength: number;
  soundName: string;
  notes: Note[];
  group: string;
  padNumber: number;
};

export type ViewScene = {
  name: string;
  patterns: ViewPattern[];
  maxLength: number;
  maxBars: number;
};

export type ViewPad = Pad;

export type ViewData = {
  pads: Record<string, ViewPad[]>;
  scenes: Record<string, ViewScene[]>;
};

function findSoundNumberByPad(pad: string, pads: Record<string, Pad[]>) {
  const group = pad[0];
  const padNumber = parseInt(pad.slice(1), 10);
  const padData = pads[group][padNumber];

  if (!padData) {
    return null;
  }

  if (padData.soundNumber === 0) {
    return null;
  }

  return padData.soundNumber;
}

function findSoundByPad(pad: string, pads: Record<string, Pad[]>, sounds: Sound[]) {
  const soundNumber = findSoundNumberByPad(pad, pads);

  return sounds.find((s) => s.id === soundNumber) || null;
}

function calcMaxLength(patterns: Pattern[]) {
  return Math.max(...patterns.flatMap((p) => p.notes.map((n) => n.position + n.duration)));
}

function renderViewTransformer(data: ProjectRawData, sounds: Sound[]) {
  const { pads, scenes } = data;
  const newScenes: ViewScene[] = [];
  const usedPads = new Set<string>();

  // construct new scenes array
  // and collect the used pads
  for (const scene in scenes) {
    newScenes[Number(scene) - 1] = {
      name: scene,
      maxLength: calcMaxLength(scenes[scene].patterns),
      maxBars: Math.max(...scenes[scene].patterns.map((p) => p.bars)),
      patterns: [],
    };

    for (const pattern of scenes[scene].patterns) {
      if (pattern.notes.length > 0) {
        usedPads.add(pattern.pad);
      }
    }
  }

  // copy patterns and add some additional fields
  for (const scene of newScenes) {
    scene.patterns = scenes[scene.name].patterns.map((pattern) => ({
      ...pattern,
      maxLength:
        pattern.notes.length > 0
          ? pattern.notes[pattern.notes.length - 1].position +
            pattern.notes[pattern.notes.length - 1].duration
          : 0,
      soundName: findSoundByPad(pattern.pad, pads, sounds)?.meta.name,
      group: pattern.pad[0],
      padNumber: parseInt(pattern.pad.slice(1), 10),
    }));
  }

  // make sure each scene have the same tracks/pads
  for (const scene of newScenes) {
    usedPads.forEach((pad) => {
      const patternByPad = scene.patterns.find((p) => p.pad === pad);
      const group = pad[0];
      const padNumber = parseInt(pad.slice(1), 10);

      if (!patternByPad) {
        scene.patterns.push({
          pad,
          notes: [],
          bars: 0,
          group,
          padNumber,
          soundName: '',
          maxLength: 0,
        });
      }
    });
  }

  // sort patterns by pad names
  for (const scene of newScenes) {
    scene.patterns = scene.patterns.toSorted((a, b) => {
      const la = a.pad[0];
      const lb = b.pad[0];

      if (la !== lb) {
        return la.localeCompare(lb);
      }

      return parseInt(a.pad.slice(1), 10) - parseInt(b.pad.slice(1), 10);
    });
  }

  return {
    pads,
    scenes: newScenes,
  };
}

export default renderViewTransformer;
