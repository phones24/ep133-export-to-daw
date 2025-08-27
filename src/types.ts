import { DeviceService } from './ep133/device-service';
import { FSNode } from './ep133/fs';
import { TarFile } from './lib/untar';

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

export type ProjectSettings = {
  bpm: number;
};

export type Pattern = {
  pad: string;
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
  file: TarFile;
  rawData: Uint8Array;
  soundId: number;
  volume: number;
  panning?: number;
};

export type ProjectRawData = {
  pads: Record<string, Pad[]>;
  scenes: Record<string, Scene>;
  settings: ProjectSettings;
};

export type ExportResult = {
  files: {
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }[];
};

export type ExportFormatId = 'dawproject' | 'dawproject_with_clips' | 'midi';

export type ExportStatus = {
  status: string;
  progress: number;
};

export type ExportFormat = {
  name: string;
  value: ExportFormatId;
  exportFn: (
    type: ExportFormatId,
    projectId: string,
    data: ProjectRawData,
    sounds: Sound[],
    deviceService: DeviceService,
    progressCallback: ({ progress, status }: ExportStatus) => void,
  ) => Promise<ExportResult>;
};

export type SoundInfo = {
  soundId: number;
  soundMeta: SoundMetadata;
};
