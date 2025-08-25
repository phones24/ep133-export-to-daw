import { Sound } from '../hooks/useAllSounds';
import { ProjectRawData } from '../hooks/useProject';
import { Note, Pad } from './parsers';

export type DawData = {
  tracks: [];
  lanes: [];
};

export type DawTrack = {
  pad: string;
  name: string;
  volume: number;
};

export type DawLane = {
  pad: string;
  clips: DawClip[];
};

export type DawClip = {
  notes: Note[];
  bars: number;
  offset: number;
};

function findPad(pad: string, pads: Record<string, Pad[]>) {
  const group = pad[0];
  const padNumber = parseInt(pad.slice(1), 10);
  const padData = pads[group][padNumber];

  return padData;
}

function findSoundNumberByPad(pad: string, pads: Record<string, Pad[]>) {
  const padData = findPad(pad, pads);

  if (!padData) {
    return null;
  }

  if (padData.soundNumber === 0) {
    return null;
  }

  return padData.soundNumber;
}

function findSoundByPad(pad: string, pads: Record<string, Pad[]>, sounds: Sound[]) {
  const soundNumber = findSoundNumberByPad(pad, pads);

  return sounds.find((s) => s.id === soundNumber) || null;
}

function dawProjectTransformer(data: ProjectRawData, sounds: Sound[]) {
  const { pads, scenes } = data;
  const tracks: DawTrack[] = [];
  const lanes: DawLane[] = [];

  console.log('---------', data);

  let offset = 0;
  Object.values(scenes).forEach((scene) => {
    const sceneBars = Math.max(...scene.patterns.map((p) => p.bars));

    for (const pattern of scene.patterns) {
      let track = tracks.find((c) => c.pad === pattern.pad);

      if (!track) {
        const sound = findSoundByPad(pattern.pad, pads, sounds);
        const pad = findPad(pattern.pad, pads);

        track = {
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
      });

      if (pattern.bars < sceneBars) {
        for (let i = 0; i < sceneBars - pattern.bars; i += pattern.bars) {
          lane.clips.push({
            offset: offset + pattern.bars + i,
            notes: pattern.notes,
            bars: pattern.bars,
          });
        }
      }
    }

    offset += sceneBars;
  });

  return {
    tracks,
    lanes,
  };
}

export default dawProjectTransformer;
