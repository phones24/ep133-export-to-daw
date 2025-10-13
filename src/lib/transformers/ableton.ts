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

export type AblTrack = Omit<Pad, 'file' | 'rawData'> & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
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

    for (const pattern of scene.patterns) {
      let track = tracks.find((c) => c.padCode === pattern.pad);

      if (!track) {
        const soundId = findSoundIdByPad(pattern.pad, pads) || 0;
        const sound = findSoundByPad(pattern.pad, pads, data.sounds);
        const pad = findPad(pattern.pad, pads);

        if (!pad) {
          throw new Error(`Could not find pad for ${pattern.pad}, pads: ${JSON.stringify(pads)}`);
        }

        const faderParams = data.settings.groupFaderParams[pad.group];

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
      });

      track.lane = lane;
    }

    offset += sceneBars;

    ablScenes.push(ablScene);
  });

  if (exporterParams.drumRackFirstGroup) {
    // fake track for drum rack
    const drumTrack: AblTrack = {
      padCode: 'a0',
      group: 'a',
      sampleName: '',
      sampleChannels: 0,
      sampleRate: 0,
      bpm: data.settings.bpm,
      drumRack: true,
      soundId: 0,
      name: 'Drums',
      volume: 2,
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
      tracks: [],
      inChokeGroup: false,
      faderParams: data.settings.groupFaderParams.a,
      timeSignature: data.scenesSettings.timeSignature,
    };

    for (const track of tracks) {
      if (track.group === 'a') {
        drumTrack.tracks.push(track);
      }
    }

    // we need to merge notes from all tracks in group A into one track
    // and remap them
    const newClips: Record<string, AblClip> = {};
    drumTrack.tracks
      .sort((a, b) => a.padCode.localeCompare(b.padCode))
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
      padCode: 'a0',
      clips: Object.values(newClips),
    };

    tracks = tracks.filter((t) => t.group !== 'a');

    tracks.unshift(drumTrack);
  }

  return {
    tracks,
    scenes: ablScenes,
  } as AblData;
}

export default abletonTransformer;
