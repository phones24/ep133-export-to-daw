import { ExporterParams, Note, Pad, PadCode, ProjectRawData, Sound } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type AblData = {
  tracks: AblTrack[];
  lanes: AblLane[];
  scenes: AblScene[];
};

export type AblTrack = Pad & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  bpm: number;
  drumRack: boolean;
  lane?: AblLane;
};

export type AblLane = {
  padCode: PadCode;
  clips: AblClip[];
};

export type AblClip = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
};

export type AblScene = {
  name: string;
};

function abletonTransformer(data: ProjectRawData, sounds: Sound[], exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  const tracks: AblTrack[] = [];
  const lanes: AblLane[] = [];
  const ablScenes: AblScene[] = [];
  let offset = 0;

  scenes.forEach((scene, sceneIndex) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));
    const ablScene: AblScene = {
      name: scene.name,
    };

    for (const pattern of scene.patterns) {
      let track = tracks.find((c) => c.padCode === pattern.pad);

      if (!track) {
        const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
        const sound = findSoundByPad(pattern.pad, pads, sounds);
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
          drumRack: false,
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

      track.lane = lane;
    }

    offset += sceneBars;

    ablScenes.push(ablScene);
  });

  return {
    tracks,
    lanes,
    scenes: ablScenes,
  } as AblData;
}

export default abletonTransformer;
