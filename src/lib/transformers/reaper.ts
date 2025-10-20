import * as Sentry from '@sentry/react';
import { omit } from 'lodash';
import { Note, Pad, PadCode, ProjectRawData, TimeSignature } from '../../types/types';
import { getSampleName } from '../exporters/utils';
import { findPad, findSoundByPad, findSoundIdByPad } from '../utils';

export type RprData = {
  tracks: RprTrack[];
};

export type RprTrack = Omit<Pad, 'file' | 'rawData' | 'group' | 'midiChannel'> & {
  padCode: PadCode;
  group: string;
  sampleName: string;
  sampleChannels: number;
  sampleRate: number;
  bpm: number;
  items: RprTrackItem[];
  timeSignature: TimeSignature;
};

export type RprTrackItem = {
  notes: Note[];
  bars: number;
  offset: number;
  sceneBars: number;
  sceneIndex: number;
  sceneName: string;
};

export function reaperTransform(data: ProjectRawData) {
  const { pads, scenes } = data;
  const tracks: RprTrack[] = [];
  let offset = 0;

  scenes.forEach((scene, sceneIndex) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));
    scene.patterns.forEach((pattern) => {
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
          timeSignature: data.scenesSettings.timeSignature,
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
    });

    offset += sceneBars;
  });

  Sentry.setContext('reaperData', {
    tracks,
  });

  return {
    tracks,
  } as RprData;
}

export default reaperTransform;
