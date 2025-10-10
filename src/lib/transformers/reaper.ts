import { omit } from 'lodash';
import { ExporterParams, Note, Pad, PadCode, ProjectRawData } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type RprData = {
  tracks: RprTrack[];
};

export type RprTrack = Omit<Pad, 'file' | 'rawData' | 'group'> & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  bpm: number;
  items: RprTrackItem[];
};

export type RprTrackItem = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
};

export function reaperTransform(data: ProjectRawData, exporterParams: ExporterParams) {
  const { pads, scenes } = data;
  const tracks: RprTrack[] = [];
  let offset = 0;

  scenes.forEach((scene, sceneIndex) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));

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
          items: [],
        };

        tracks.push(track);
      }

      track.items.push({
        offset,
        notes: pattern.notes,
        bars: pattern.bars,
        sceneBars,
        sceneIndex,
        sceneName: scene.name,
      });
    }

    offset += sceneBars;
  });
  /*
  if (exporterParams.drumRackFirstGroup) {
    // fake track for drum rack
    const drumTrack: RprTrack = {
      padCode: 'a0',
      group: 'a',
      sampleName: '',
      sampleChannels: 0,
      sampleRate: 0,
      bpm: data.settings.bpm,
      soundId: 0,
      name: 'Drums',
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

    tracks = tracks.filter((t) => t.group !== 'a');
    tracks.unshift(drumTrack);

    const drumLane: RprLane = {
      padCode: 'a0',
      group: 'a',
      clips: [],
    };

    const newClips: Record<string, RprTrackItem> = {};

    lanes
      .filter((l) => l.group === 'a')
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

    lanes = lanes.filter((l) => l.group !== 'a');
    lanes.unshift(drumLane);

    rprScenes.forEach((scene) => {
      scene.clipSlot = scene.clipSlot.filter((cs) => cs.track.group !== 'a');
      scene.clipSlot.unshift({
        clip: drumLane.clips.filter((c) => c.sceneName === scene.name),
        track: drumTrack,
      });
    });
  }
*/
  return {
    tracks,
  } as RprData;
}

export default reaperTransform;
