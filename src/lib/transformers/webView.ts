import { Note, Pad, ProjectRawData } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findSoundByPad, findSoundIdByPad } from '../utils';

export type ViewPattern = {
  pad: string;
  bars: number;
  soundName: string;
  notes: Note[];
  group: string;
  padNumber: number;
};

export type ViewScene = {
  name: string;
  patterns: ViewPattern[];
  maxBars: number;
};

export type ViewPad = Pad;

export type ViewData = {
  pads: Record<string, ViewPad[]>;
  scenes: Record<string, ViewScene[]>;
};

function webViewTransformer(data: ProjectRawData) {
  const { pads, scenes } = data;
  const newScenes: ViewScene[] = [];
  const usedPads = new Set<string>();

  // construct new scenes array
  // and collect the used pads
  scenes.forEach((scene, idx) => {
    newScenes[idx] = {
      name: scene.name,
      maxBars: Math.max(...scene.patterns.map((p) => p.bars)),
      patterns: [],
    };

    for (const pattern of scene.patterns) {
      if (pattern.notes.length > 0) {
        usedPads.add(pattern.pad);
      }
    }
  });

  // copy patterns and add some additional fields
  newScenes.forEach((scene, idx) => {
    scene.patterns = scenes[idx].patterns.map((pattern) => {
      const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
      const sound = findSoundByPad(pattern.pad, pads, data.sounds);

      return {
        ...pattern,
        soundName: getSampleName(sound?.meta?.name, soundId, false),
        group: pattern.pad[0],
        padNumber: parseInt(pattern.pad.slice(1), 10),
      };
    });
  });

  // make sure each scene have the same tracks/pads
  for (const scene of newScenes) {
    usedPads.forEach((pad) => {
      const patternByPad = scene.patterns.find((p) => p.pad === pad);
      const group = pad[0];
      const padNumber = parseInt(pad.slice(1), 10);

      if (!patternByPad) {
        const soundId = findSoundIdByPad(pad, pads) || 0;
        const sound = findSoundByPad(pad, pads, data.sounds);

        scene.patterns.push({
          pad,
          notes: [],
          bars: 0,
          group,
          padNumber,
          soundName: getSampleName(sound?.meta?.name, soundId, false),
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

export default webViewTransformer;
