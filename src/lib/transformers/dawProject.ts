import { Note, ProjectRawData, Sound } from '../../types';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type DawData = {
  tracks: [];
  lanes: [];
  scenes: DawScene[];
};

export type DawTrack = {
  pad: string;
  name: string;
  volume: number;
  soundId: number;
};

export type DawLane = {
  pad: string;
  clips: DawClip[];
};

export type DawClip = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
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

function dawProjectTransformer(data: ProjectRawData, sounds: Sound[]) {
  const { pads, scenes } = data;
  const tracks: DawTrack[] = [];
  const lanes: DawLane[] = [];
  const dawScenes: DawScene[] = [];
  let offset = 0;

  Object.values(scenes).forEach((scene) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));
    const dawScene: DawScene = {
      name: scene.name,
      clipSlot: [],
    };

    for (const pattern of scene.patterns) {
      let track = tracks.find((c) => c.pad === pattern.pad);

      if (!track) {
        const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
        const sound = findSoundByPad(pattern.pad, pads, sounds);
        const pad = findPad(pattern.pad, pads);

        track = {
          soundId,
          pad: pattern.pad,
          name: sound?.meta.name || pattern.pad,
          volume: pad.volume * (2 / 200),
        };

        tracks.push(track);
      }

      let lane = lanes.find((c) => c.pad === pattern.pad);

      if (!lane) {
        lane = {
          pad: pattern.pad,
          clips: [],
        };

        lanes.push(lane);
      }

      lane.clips.push({
        offset,
        notes: pattern.notes,
        bars: pattern.bars,
        sceneBars,
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
