import * as Sentry from '@sentry/react';
import omit from 'lodash/omit';
import {
  ExporterParams,
  FaderParam,
  Note,
  Pad,
  PadCode,
  ProjectRawData,
  TimeSignature,
} from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type AblData = {
  tracks: AblTrack[];
  scenes: AblScene[];
};

export type AblTrack = Omit<Pad, 'file' | 'rawData' | 'midiChannel'> & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  sampleRootNote: number;
  samplePitch: number;
  bpm: number;
  drumRack: boolean;
  lane?: AblLane;
  tracks: AblTrack[];
  faderParams: { [K in FaderParam]: number };
  timeSignature: TimeSignature;
};

export type AblLane = {
  padCode: PadCode;
  clips: AblClip[];
};

export type AblNote = Note;

export type AblClip = {
  notes: AblNote[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
  timeSignature: TimeSignature;
  faderParams: { [K in FaderParam]: number };
};

export type AblScene = {
  name: string;
};

function abletonTransformer(data: ProjectRawData, exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  const lanes: AblLane[] = [];
  const ablScenes: AblScene[] = [];
  let tracks: AblTrack[] = [];
  let offset = 0;

  scenes.forEach((scene, sceneIndex) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));
    const ablScene: AblScene = {
      name: scene.name,
    };

    scene.patterns.forEach((pattern) => {
      let track = tracks.find((c) => c.padCode === pattern.pad);
      const pad = findPad(pattern.pad, pads);
      if (!pad) {
        throw new Error(`Could not find pad for ${pattern.pad}, pads: ${JSON.stringify(pads)}`);
      }
      const faderParams = data.settings.groupFaderParams[pad.group];

      if (!track) {
        const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
        const sound = findSoundByPad(pattern.pad, pads, data.sounds);
        track = {
          ...omit(pad, ['file', 'rawData']),
          soundId,
          padCode: pattern.pad,
          name: sound?.meta?.name || pattern.pad,
          volume: pad.volume / 200, // converting from 0-200 to 0.0-1.0
          sampleName: getSampleName(sound?.meta?.name, soundId),
          sampleChannels: sound?.meta?.channels || 0,
          sampleRate: sound?.meta?.samplerate || 0,
          sampleRootNote: sound?.meta?.['sound.rootnote'] ?? 60,
          samplePitch: sound?.meta?.['sound.pitch'] ?? 0,
          bpm: data.settings.bpm,
          drumRack: false,
          tracks: [],
          faderParams,
          timeSignature: data.scenesSettings.timeSignature,
        };

        tracks.push(track);
      }

      let lane = lanes.find((c) => c.padCode === pattern.pad);
      if (!lane) {
        lane = {
          padCode: pattern.pad,
          clips: [],
        };

        lanes.push(lane);
      }

      lane.clips.push({
        offset,
        notes: pattern.notes,
        bars: pattern.bars,
        sceneBars,
        sceneIndex,
        sceneName: scene.name,
        timeSignature: data.scenesSettings.timeSignature,
        faderParams,
      });

      track.lane = lane;
    });

    offset += sceneBars;

    ablScenes.push(ablScene);
  });

  tracks.sort((a, b) =>
    a.padCode.localeCompare(b.padCode, undefined, { numeric: true, sensitivity: 'base' }),
  );

  // Helper function to create a drum rack track for a specific group
  const createDrumRackTrack = (group: 'a' | 'b' | 'c' | 'd'): AblTrack | null => {
    const groupTracksForDrumRack = tracks.filter((t) => t.group === group);
    if (groupTracksForDrumRack.length === 0) {
      return null;
    }

    const drumTrack: AblTrack = {
      padCode: `${group}0` as PadCode,
      group,
      sampleName: '',
      sampleChannels: 0,
      sampleRate: 0,
      sampleRootNote: 60,
      samplePitch: 0,
      bpm: data.settings.bpm,
      drumRack: true,
      soundId: 0,
      name: `Drums ${group.toUpperCase()}`,
      volume: 1, // 1 means 0dB
      attack: 0,
      release: 0,
      trimLeft: 0,
      trimRight: 0,
      pad: 0,
      lane: undefined,
      playMode: 'oneshot',
      pan: 0,
      pitch: 0,
      rootNote: 60,
      timeStretch: 'off',
      timeStretchBpm: 0,
      timeStretchBars: 0,
      soundLength: 0,
      tracks: groupTracksForDrumRack,
      inChokeGroup: false,
      faderParams: data.settings.groupFaderParams[group],
      timeSignature: data.scenesSettings.timeSignature,
    };

    // we need to merge notes from all tracks in the group into one track
    // and remap them
    const newClips: Record<string, AblClip> = {};
    drumTrack.tracks
      .toSorted((a, b) =>
        a.padCode.localeCompare(b.padCode, undefined, { numeric: true, sensitivity: 'base' }),
      )
      .forEach((track, idx) => {
        track.lane?.clips.forEach((clip) => {
          if (!newClips[clip.sceneName]) {
            newClips[clip.sceneName] = structuredClone(clip);
            newClips[clip.sceneName].notes = []; // resetting notes, they will be added below with new mapping
          }

          newClips[clip.sceneName].notes = [
            ...newClips[clip.sceneName].notes,
            ...clip.notes.map((n) => ({
              ...n,
              note: 36 + idx,
            })), // remaping notes starting from C1 (36)
          ];
        });
      });

    drumTrack.lane = {
      padCode: `${group}0` as PadCode,
      clips: Object.values(newClips),
    };

    return drumTrack;
  };

  // Process drum racks for each group that has the option enabled
  const drumRackTracks: AblTrack[] = [];
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
        tracks = tracks.filter((t) => t.group !== group);
      }
    }
  }

  // Insert drum rack tracks at the beginning, maintaining group order (A, B, C, D)
  tracks.unshift(...drumRackTracks);

  Sentry.setContext(`abletonData`, {
    tracks,
    scenes: ablScenes,
  });

  return {
    tracks,
    scenes: ablScenes,
  } as AblData;
}

export default abletonTransformer;
