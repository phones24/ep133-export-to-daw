import { ExporterParams, Note, ProjectRawData, Sound } from '../../types/types';
import { findSoundByPad } from '../utils';

export type MidiData = {
  tracks: MidiTrack[];
};

export type MidiTrack = {
  name: string;
  group: string;
  padCode: string;
  notes: Note[];
};

const UNITS_PER_BAR = 24 * 16;

function midiTransformer(data: ProjectRawData, sounds: Sound[], exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  let midiTracks: MidiTrack[] = [];
  let offset = 0;

  scenes.forEach((scene) => {
    const sceneMaxBars = Math.max(...scene.patterns.map((p) => p.bars));

    for (const pattern of scene.patterns) {
      let track = midiTracks.find((t) => t.padCode === pattern.pad);

      if (!track) {
        const sound = findSoundByPad(pattern.pad, pads, sounds);

        track = {
          name: sound?.meta.name || pattern.pad,
          padCode: pattern.pad,
          group: pattern.group,
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

  if (exporterParams.drumRackFirstGroup) {
    const groupATracks = midiTracks.filter((t) => t.group === 'a');

    if (groupATracks.length > 0) {
      const mergedNotes: Note[] = [];

      groupATracks
        .toSorted((a, b) => a.padCode.localeCompare(b.padCode))
        .forEach((track, idx) => {
          mergedNotes.push(
            ...track.notes.map((note) => ({
              ...note,
              note: 36 + idx,
            })),
          );
        });

      const drumTrack: MidiTrack = {
        name: 'Drums',
        group: 'a',
        padCode: 'a0',
        notes: mergedNotes,
      };

      midiTracks = midiTracks.filter((t) => t.group !== 'a');
      midiTracks.unshift(drumTrack);
    }
  }

  return {
    tracks: midiTracks,
  } as MidiData;
}

export default midiTransformer;
