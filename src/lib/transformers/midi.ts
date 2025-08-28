import { Note, ProjectRawData, Sound } from '../../types';
import { findSoundByPad } from '../utils';

export type MidiData = {
  tracks: MidiTrack[];
};

export type MidiTrack = {
  name: string;
  pad: string;
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
      let track = midiTracks.find((t) => t.pad === pattern.pad);

      if (!track) {
        const sound = findSoundByPad(pattern.pad, pads, sounds);

        track = {
          name: sound?.meta?.name || pattern.pad || 'sound',
          pad: pattern.pad,
          notes: pattern.notes.map((note) => ({
            ...note,
            position: note.position + offset * UNITS_PER_BAR,
          })),
        };

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

  console.log(midiTracks);

  return {
    tracks: midiTracks,
  } as MidiData;
}

export default midiTransformer;
