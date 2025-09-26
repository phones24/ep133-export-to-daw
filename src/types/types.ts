import { DeviceService } from '../ep133/device-service';
import { FSNode } from '../ep133/fs';
import { TarFile } from '../lib/untar';

export type Group = 'a' | 'b' | 'c' | 'd';
export type PadNumber = `${number}`;
export type PadCode = `${Group}${PadNumber}`;

export type SoundMetadata = {
  channels: number;
  samplerate: number;
  format: 's16' | 's24' | 'float';
  crc: number;
  'sound.loopstart': number;
  'sound.loopend': number;
  name: string;
  'sound.amplitude': number;
  'sound.playmode': 'oneshot' | 'loop';
  'sound.pan': number;
  'sound.pitch': number;
  'sound.rootnote': number;
  'time.mode': string;
  'sound.bpm': number;
  'envelope.attack': number;
  'envelope.release': number;
};

export type Sound = {
  path: string;
  id: number;
  node: FSNode;
  meta: SoundMetadata;
};

export enum EffectType {
  Off = 0,
  Delay = 1,
  Reverb = 2,
  Distortion = 3,
  Chorus = 4,
  Filter = 5,
  Compressor = 6,
}

export enum FaderParam {
  LVL = 0,
  PTC = 1,
  TIM = 2,
  LPF = 3,
  HPF = 4,
  FX = 5,
  ATK = 6,
  REL = 7,
  PAN = 8,
  TUNE = 9,
  VEL = 10,
  MOD = 11,
}

export type GroupFaderParam = {
  [group: string]: {
    [K in FaderParam]: number;
  };
};

export type ProjectSettings = {
  bpm: number;
  groupFaderParams: GroupFaderParam;
  faderAssignment: Record<string, FaderParam>;
  rawData: Uint8Array;
};

export type Effects = {
  rawData: Uint8Array;
  effectType: EffectType;
  param1: number;
  param2: number;
};

export type Pattern = {
  pad: PadCode;
  group: Group;
  notes: Note[];
  bars: number;
};

export type Scene = {
  name: string;
  patterns: Pattern[];
};

export type Note = {
  note: number;
  position: number;
  duration: number;
  velocity: number;
};

export type Pad = {
  pad: number;
  name: string;
  group: Group;
  file: TarFile;
  rawData: Uint8Array;
  soundId: number;
  volume: number;
  attack: number;
  release: number;
  trimLeft: number;
  trimRight: number;
  soundLength: number;
  playMode: 'oneshot' | 'key' | 'legato';
  pan: number;
  pitch: number;
  rootNote: number;
  timeStretch: 'off' | 'bpm' | 'bars';
  timeStretchBpm: number;
  timeStretchBars: number;
  inChokeGroup: boolean;
};

export type ProjectRawData = {
  pads: Record<string, Pad[]>;
  scenes: Scene[];
  settings: ProjectSettings;
  effects: Effects;
  projectFile: File;
};

export type ExportResult = {
  files: {
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }[];
  sampleReport?: SampleReport;
};

export type ExportFormatId = 'ableton' | 'dawproject' | 'midi';

export type ExportStatus = {
  status: string;
  progress: number;
  sampleReport?: SampleReport;
};

export type SampleReport = {
  downloaded: string[];
  missing: { name: string; error: string }[];
};

export type ExportFormat = {
  name: string;
  value: ExportFormatId;
  exportFn?: (
    projectId: string,
    data: ProjectRawData,
    sounds: Sound[],
    deviceService: DeviceService,
    progressCallback: ({ progress, status }: ExportStatus) => void,
    exporterParams: ExporterParams,
  ) => Promise<ExportResult>;
};

export type ExporterParams = {
  includeArchivedSamples?: boolean;
  clips?: boolean; // build clips not arrangements
  noSampler?: boolean; // don't use sampler/simpler at all
  useSampler?: boolean; // use sampler/simpler
  groupTracks?: boolean; // group tracks by group name
  drumRackFirstGroup?: boolean; // merge tracks for first group
  sendEffects?: boolean; // send effects to return tracks
};

export type SoundInfo = {
  soundId: number;
  soundMeta: SoundMetadata;
};
