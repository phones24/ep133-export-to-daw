import { ExporterParams, Note, ProjectRawData } from '../../types/types';
import { getQuarterNotesPerBar, UNITS_PER_BEAT } from '../exporters/utils';
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

function midiTransformer(data: ProjectRawData, exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  let midiTracks: MidiTrack[] = [];
  let offset = 0;

  const barLength =
    getQuarterNotesPerBar(
      data.scenesSettings.timeSignature.numerator,
      data.scenesSettings.timeSignature.denominator,
    ) * UNITS_PER_BEAT;

  scenes.forEach((scene) => {
    const sceneMaxBars = Math.max(...scene.patterns.map((p) => p.bars));
    for (const pattern of scene.patterns) {
      let track = midiTracks.find((t) => t.padCode === pattern.pad);
      if (!track) {
        const sound = findSoundByPad(pattern.pad, pads, data.sounds);

        track = {
          name: sound?.meta.name || pattern.pad,
          padCode: pattern.pad,
          group: pattern.group,
          notes: [],
        };

        midiTracks.push(track);
      }

      track.notes.push(
        ...pattern.notes.map((note) => ({
          ...note,
          position: note.position + offset * barLength,
        })),
      );

      // copy pattern for the rest of the scene
      if (pattern.bars < sceneMaxBars) {
        for (let ofs = offset + pattern.bars; ofs < offset + sceneMaxBars; ofs++) {
          track.notes.push(
            ...pattern.notes.map((note) => ({
              ...note,
              position: note.position + ofs * barLength,
            })),
          );
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
