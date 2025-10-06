import { Note, Pad, PadCode, ProjectRawData } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type DawData = {
  tracks: DawTrack[];
  lanes: DawLane[];
  scenes: DawScene[];
};

export type DawTrack = Pad & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  bpm: number;
};

export type DawLane = {
  padCode: PadCode;
  clips: DawClip[];
};

export type DawClip = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
};

export type DawClipSlot = {
  clip: DawClip[];
  track: DawTrack;
  bars: number;
};

export type DawScene = {
  name: string;
  clipSlot: DawClipSlot[];
};

function dawProjectTransformer(data: ProjectRawData) {
  const { pads, scenes } = data;
  const tracks: DawTrack[] = [];
  const lanes: DawLane[] = [];
  const dawScenes: DawScene[] = [];
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
          ...pad,
          soundId,
          padCode: pattern.pad,
          name: sound?.meta?.name || pattern.pad,
          volume: pad.volume * (2 / 200),
          sampleName: getSampleName(sound?.meta?.name, soundId),
          sampleChannels: sound?.meta?.channels || 0,
          sampleRate: sound?.meta?.samplerate || 0,
          bpm: data.settings.bpm,
        };

        (track as any).rawData = undefined;
        (track as any).file = undefined;

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
      });

      dawScene.clipSlot.push({
        clip: lane.clips,
        track: track,
        bars: pattern.bars,
      });
    }

    offset += sceneBars;

    dawScenes.push(dawScene);
  });

  return {
    tracks,
    lanes,
    scenes: dawScenes,
  } as DawData;
}

export default dawProjectTransformer;
