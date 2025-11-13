import * as Sentry from '@sentry/react';
import { ExporterParams, Note, ProjectRawData } from '../../types/types';
import { getQuarterNotesPerBar, TICKS_PER_BEAT } from '../exporters/utils';
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
    ) * TICKS_PER_BEAT;

  scenes.forEach((scene) => {
    const sceneMaxBars = Math.max(...scene.patterns.map((p) => p.bars));
    scene.patterns.forEach((pattern) => {
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
    });

    offset += sceneMaxBars;
  });

  // Helper function to create a drum rack track for a specific group
  const createDrumRackTrack = (group: 'a' | 'b' | 'c' | 'd'): MidiTrack | null => {
    const groupTracks = midiTracks.filter((t) => t.group === group);
    if (groupTracks.length === 0) {
      return null;
    }

    const mergedNotes: Note[] = [];

    groupTracks
      .toSorted((a, b) =>
        a.padCode.localeCompare(b.padCode, undefined, { numeric: true, sensitivity: 'base' }),
      )
      .forEach((track, idx) => {
        mergedNotes.push(
          ...track.notes.map((note) => ({
            ...note,
            note: 36 + idx,
          })),
        );
      });

    const drumTrack: MidiTrack = {
      name: `Drums ${group.toUpperCase()}`,
      group,
      padCode: `${group}0`,
      notes: mergedNotes,
    };

    return drumTrack;
  };

  // Process drum racks for each group that has the option enabled
  const drumRackTracks: MidiTrack[] = [];
  const groupsToProcess: Array<{ group: 'a' | 'b' | 'c' | 'd'; enabled: boolean }> = [
    { group: 'a', enabled: exporterParams.drumRackGroupA || false },
    { group: 'b', enabled: exporterParams.drumRackGroupB || false },
    { group: 'c', enabled: exporterParams.drumRackGroupC || false },
    { group: 'd', enabled: exporterParams.drumRackGroupD || false },
  ];

  for (const { group, enabled } of groupsToProcess) {
    if (enabled) {
      const drumTrack = createDrumRackTrack(group);
      if (drumTrack) {
        drumRackTracks.push(drumTrack);
        // Remove tracks from this group from the main tracks array
        midiTracks = midiTracks.filter((t) => t.group !== group);
      }
    }
  }

  // Insert drum rack tracks at the beginning, maintaining group order (A, B, C, D)
  midiTracks.unshift(...drumRackTracks);

  Sentry.setContext('midiData', {
    tracks: midiTracks,
  });

  return {
    tracks: midiTracks,
  } as MidiData;
}

export default midiTransformer;
