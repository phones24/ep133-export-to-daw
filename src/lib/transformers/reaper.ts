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

export function reaperTransform(data: ProjectRawData, exporterParams: ExporterParams) {
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

  if (exporterParams.exportAllPadsWithSamples) {
    for (const group in pads) {
      pads[group].forEach((pad, index) => {
        if (pad.soundId <= 0) {
          return;
        }

        const padCode = `${group}${index}` as PadCode;
        if (tracks.some((t) => t.padCode === padCode)) {
          return;
        }

        const sound = data.sounds.find((s) => s.id === pad.soundId);

        tracks.push({
          ...omit(pad, ['file', 'rawData']),
          soundId: pad.soundId,
          padCode,
          name: sound?.meta?.name || padCode,
          volume: pad.volume * (2 / 200),
          sampleName: getSampleName(sound?.meta?.name, pad.soundId),
          sampleChannels: sound?.meta?.channels || 0,
          sampleRate: sound?.meta?.samplerate || 0,
          bpm: data.settings.bpm,
          timeSignature: data.scenesSettings.timeSignature,
          items: [],
        });
      });
    }

    tracks.sort((a, b) =>
      a.padCode.localeCompare(b.padCode, undefined, { numeric: true, sensitivity: 'base' }),
    );
  }

  Sentry.setContext('reaperData', {
    tracks,
  });

  return {
    tracks,
  } as RprData;
}

export default reaperTransform;
