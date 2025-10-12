import { ExporterParams, Note, ProjectRawData } from '../../types/types';
import { getQuarterNotesPerBar } from '../exporters/utils';
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

  console.log(data.scenesSettings.timeSignature);
  console.log(
    getQuarterNotesPerBar(
      data.scenesSettings.timeSignature.numerator,
      data.scenesSettings.timeSignature.denominator,
    ),
  );

  const barLength =
    data.scenesSettings.timeSignature.numerator *
    2 *
    // getQuarterNotesPerBar(
    //   data.scenesSettings.timeSignature.numerator,
    //   data.scenesSettings.timeSignature.denominator,
    // ) *
    24;

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

      track.notes = track.notes.concat(
        pattern.notes
          .filter((n) => n.position < barLength)
          .map((note) => ({
            ...note,
            position: note.position + offset * barLength,
          })),
      );

      // copy pattern for the rest of the scene
      // if (pattern.bars < sceneMaxBars) {
      //   for (let i = offset + pattern.bars; i < offset + sceneMaxBars; i++) {
      //     track.notes = [
      //       ...track.notes,
      //       ...pattern.notes.map((note) => ({
      //         ...note,
      //         position: note.position + i * UNITS_PER_BAR,
      //       })),
      //     ];
      //   }
      // }
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
