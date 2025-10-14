import { Note, Pad, ProjectRawData } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { noteNumberToName } from '../parsers';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type ViewNote = Note & { name: string };

export type ViewPattern = {
  pad: string;
  bars: number;
  soundName: string;
  notes: ViewNote[];
  group: string;
  padNumber: number;
  midiChannel: number;
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

  if (import.meta.env.DEV) {
    console.log(data);
  }

  // construct new scenes array
  // and collect the used pads
  scenes.forEach((scene, idx) => {
    newScenes[idx] = {
      name: scene.name,
      maxBars: Math.max(...scene.patterns.map((p) => p.bars), 0),
      patterns: [],
    };

    for (const pattern of scene.patterns) {
      if (pattern.notes.length > 0) {
        usedPads.add(pattern.pad);
      }
    }
  });

  newScenes.forEach((scene, idx) => {
    // make sure each scene have the same tracks/pads
    usedPads.forEach((pad) => {
      const patternByPad = scene.patterns.find((p) => p.pad === pad);
      if (!patternByPad) {
        const group = pad[0];
        const padNumber = parseInt(pad.slice(1), 10);
        const soundId = findSoundIdByPad(pad, pads) || 0;
        const sound = findSoundByPad(pad, pads, data.sounds);
        const padObject = findPad(pad, pads);

        scene.patterns.push({
          pad,
          notes: [],
          bars: 0,
          group,
          padNumber,
          soundName: getSampleName(sound?.meta?.name, soundId, false),
          midiChannel: padObject?.midiChannel || 0,
        });
      }
    });

    // copy notes to exiting patterns
    scenes[idx].patterns.forEach((pattern) => {
      const patternInScene = scene.patterns.find((p) => p.pad === pattern.pad);
      if (!patternInScene) {
        return;
      }

      patternInScene.notes = pattern.notes
        .map((note) => ({
          ...note,
          name: noteNumberToName(note.note),
        }))
        .reduce((acc, note) => {
          const existingNoteInThisPosition = acc.find((n) => n.position === note.position);

          if (existingNoteInThisPosition) {
            existingNoteInThisPosition.name = `${existingNoteInThisPosition.name},${note.name}`;
            return acc;
          }

          acc.push({ ...note });
          return acc;
        }, [] as ViewNote[]);
      patternInScene.bars = pattern.bars;
    });
  });

  return {
    pads,
    scenes: newScenes,
    scenesSettings: data.scenesSettings,
  };
}

export default webViewTransformer;
