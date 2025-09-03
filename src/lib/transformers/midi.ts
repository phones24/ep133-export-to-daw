import { Note, ProjectRawData, Sound } from '../../types/types';
import { findSoundByPad } from '../utils';

export type MidiData = {
  tracks: MidiTrack[];
};

export type MidiTrack = {
  name: string;
  padCode: string;
  notes: Note[];
};

const UNITS_PER_BAR = 24 * 16;

function midiTransformer(data: ProjectRawData, sounds: Sound[]) {
  const { pads, scenes } = data;
  const midiTracks: MidiTrack[] = [];
  let offset = 0;

  Object.values(scenes).forEach((scene) => {
    const sceneMaxBars = Math.max(...scene.patterns.map((p) => p.bars));

    for (const pattern of scene.patterns) {
      let track = midiTracks.find((t) => t.padCode === pattern.pad);

      if (!track) {
        const sound = findSoundByPad(pattern.pad, pads, sounds);

        track = {
          name: sound?.meta.name || pattern.pad,
          padCode: pattern.pad,
          notes: pattern.notes.map((note) => ({
            ...note,
            position: note.position + offset * UNITS_PER_BAR,
          })),
        };

        // copy pattern for the rest of the scene
        if (pattern.bars < sceneMaxBars) {
          for (let i = offset + pattern.bars; i < offset + sceneMaxBars; i++) {
            track.notes = [
              ...track.notes,
              ...pattern.notes.map((note) => ({
                ...note,
                position: note.position + i * UNITS_PER_BAR,
              })),
            ];
          }
        }

        midiTracks.push(track);

        continue;
      }

      track.notes = track.notes.concat(
        pattern.notes.map((note) => ({
          ...note,
          position: note.position + offset * UNITS_PER_BAR,
        })),
      );

      // copy pattern for the rest of the scene
      if (pattern.bars < sceneMaxBars) {
        for (let i = offset + pattern.bars; i < offset + sceneMaxBars; i++) {
          track.notes = [
            ...track.notes,
            ...pattern.notes.map((note) => ({
              ...note,
              position: note.position + i * UNITS_PER_BAR,
            })),
          ];
        }
      }
    }

    offset += sceneMaxBars;
  });

  return {
    tracks: midiTracks,
  } as MidiData;
}

export default midiTransformer;
