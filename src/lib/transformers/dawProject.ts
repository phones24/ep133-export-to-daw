import * as Sentry from '@sentry/react';
import { omit } from 'lodash';
import {
  ExporterParams,
  Note,
  Pad,
  PadCode,
  ProjectRawData,
  TimeSignature,
} from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type DawData = {
  tracks: DawTrack[];
  lanes: DawLane[];
  scenes: DawScene[];
};

export type DawTrack = Omit<Pad, 'file' | 'rawData' | 'midiChannel'> & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  bpm: number;
};

export type DawLane = {
  padCode: PadCode;
  group?: string;
  clips: DawClip[];
};

export type DawClip = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
  sceneTimeSignature: TimeSignature;
};

export type DawClipSlot = {
  clip: DawClip[];
  track: DawTrack;
};

export type DawScene = {
  name: string;
  clipSlot: DawClipSlot[];
};

function dawProjectTransformer(data: ProjectRawData, exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  const dawScenes: DawScene[] = [];
  let lanes: DawLane[] = [];
  let tracks: DawTrack[] = [];
  let offset = 0;

  scenes.forEach((scene, sceneIndex) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));
    const dawScene: DawScene = {
      name: scene.name,
      clipSlot: [],
    };

    for (const pattern of scene.patterns) {
      let track = tracks.find((c) => c.padCode === pattern.pad);

      if (!track) {
        const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
        const sound = findSoundByPad(pattern.pad, pads, data.sounds);
        const pad = findPad(pattern.pad, pads);

        if (!pad) {
          throw new Error(`Could not find pad for ${pattern.pad}`);
        }

        track = {
          ...omit(pad, ['file', 'rawData']),
          soundId,
          padCode: pattern.pad,
          name: sound?.meta?.name || pattern.pad,
          volume: pad.volume * (2 / 200),
          sampleName: getSampleName(sound?.meta?.name, soundId),
          sampleChannels: sound?.meta?.channels || 0,
          sampleRate: sound?.meta?.samplerate || 0,
          bpm: data.settings.bpm,
        };

        tracks.push(track);
      }

      let lane = lanes.find((c) => c.padCode === pattern.pad);

      if (!lane) {
        lane = {
          padCode: pattern.pad,
          group: track.group,
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
        sceneTimeSignature: data.scenesSettings.timeSignature,
      });

      dawScene.clipSlot.push({
        clip: lane.clips,
        track: track,
      });
    }

    offset += sceneBars;

    dawScenes.push(dawScene);
  });

  // Helper function to create a drum rack track and lane for a specific group
  const createDrumRackForGroup = (group: 'a' | 'b' | 'c' | 'd'): {
    drumTrack: DawTrack;
    drumLane: DawLane;
  } | null => {
    const groupTracks = tracks.filter((t) => t.group === group);
    const groupLanes = lanes.filter((l) => l.group === group);

    if (groupTracks.length === 0) {
      return null;
    }

    const drumTrack: DawTrack = {
      padCode: `${group}0` as PadCode,
      group,
      sampleName: '',
      sampleChannels: 0,
      sampleRate: 0,
      bpm: data.settings.bpm,
      soundId: 0,
      name: `Drums ${group.toUpperCase()}`,
      volume: 1,
      attack: 0,
      release: 0,
      trimLeft: 0,
      trimRight: 0,
      pad: 0,
      playMode: 'oneshot',
      pan: 0,
      pitch: 0,
      rootNote: 60,
      timeStretch: 'off',
      timeStretchBpm: 0,
      timeStretchBars: 0,
      soundLength: 0,
      inChokeGroup: false,
    };

    const drumLane: DawLane = {
      padCode: `${group}0` as PadCode,
      group,
      clips: [],
    };

    const newClips: Record<string, DawClip> = {};

    groupLanes
      .toSorted((a, b) => a.padCode.localeCompare(b.padCode))
      .forEach((lane, idx) => {
        lane.clips.forEach((clip) => {
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

    drumLane.clips = Object.values(newClips);

    return { drumTrack, drumLane };
  };

  // Process drum racks for each group that has the option enabled
  const drumRackData: Array<{ drumTrack: DawTrack; drumLane: DawLane }> = [];
  const groupsToProcess: Array<{ group: 'a' | 'b' | 'c' | 'd'; enabled: boolean }> = [
    { group: 'a', enabled: exporterParams.drumRackGroupA || false },
    { group: 'b', enabled: exporterParams.drumRackGroupB || false },
    { group: 'c', enabled: exporterParams.drumRackGroupC || false },
    { group: 'd', enabled: exporterParams.drumRackGroupD || false },
  ];

  for (const { group, enabled } of groupsToProcess) {
    if (enabled) {
      const drumRack = createDrumRackForGroup(group);
      if (drumRack) {
        drumRackData.push(drumRack);
        // Remove tracks and lanes from this group from the main arrays
        tracks = tracks.filter((t) => t.group !== group);
        lanes = lanes.filter((l) => l.group !== group);
      }
    }
  }

  // Insert drum rack tracks and lanes at the beginning, maintaining group order (A, B, C, D)
  tracks.unshift(...drumRackData.map((d) => d.drumTrack));
  lanes.unshift(...drumRackData.map((d) => d.drumLane));

  // Update scenes to include drum rack clip slots
  const groupsConvertedToDrumRack = drumRackData.map((d) => d.drumTrack.group);
  dawScenes.forEach((scene) => {
    // Remove clip slots for groups that were converted to drum racks
    scene.clipSlot = scene.clipSlot.filter(
      (cs) => !groupsConvertedToDrumRack.includes(cs.track.group),
    );

    // Add drum rack clip slots at the beginning, maintaining group order
    for (const { drumTrack, drumLane } of drumRackData) {
      scene.clipSlot.unshift({
        clip: drumLane.clips.filter((c) => c.sceneName === scene.name),
        track: drumTrack,
      });
    }
  });

  Sentry.setContext(`dawprojectData`, {
    tracks,
    lanes,
    scenes: dawScenes,
  });

  return {
    tracks,
    lanes,
    scenes: dawScenes,
  } as DawData;
}

export default dawProjectTransformer;
