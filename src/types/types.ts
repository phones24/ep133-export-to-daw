import { DeviceService } from '../ep133/device-service';
import { FSNode } from '../ep133/fs';
import { TarFile } from '../lib/untar';

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
  pad: PadCode;
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
  group: 'a' | 'b' | 'c' | 'd';
  file: TarFile;
  rawData: Uint8Array;
  soundId: number;
  volume: number;
  attack: number;
  release: number;
  trimLeft: number;
  trimRight: number;
  soundLength: number;
  pan: number;
  pitch: number;
  rootNote: number;
  timeStretch: 'off' | 'bpm' | 'bars';
  timeStretchBpm: number;
  timeStretchBars: string;
};

export type ProjectRawData = {
  pads: Record<string, Pad[]>;
  scenes: Scene[];
  settings: ProjectSettings;
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
  groupTracks?: boolean; // group tracks in ableton export
};

export type SoundInfo = {
  soundId: number;
  soundMeta: SoundMetadata;
};

// Google Analytics gtag types
declare global {
  interface Window {
    gtag: GtagFunction;
  }
}

type GtagFunction = {
  (
    command: 'config',
    targetId: string,
    config?: {
      [key: string]: any;
      anonymize_ip?: boolean;
      allow_ad_features?: boolean;
      allow_google_signals?: boolean;
      cookie_domain?: string;
      cookie_expires?: number;
      cookie_flags?: string;
      cookie_name?: string;
      cookie_prefix?: string;
      cookie_update?: boolean;
      page_title?: string;
      page_location?: string;
      send_page_view?: boolean;
      user_id?: string;
    },
  ): void;

  (command: 'set', targetId: string | 'user_properties', config: Record<string, any>): void;

  (
    command: 'event',
    action: string,
    parameters?: {
      [key: string]: any;
      event_category?: string;
      event_label?: string;
      value?: number;
      custom_map?: Record<string, string>;
      items?: Array<{
        item_id?: string;
        item_name?: string;
        affiliation?: string;
        coupon?: string;
        currency?: string;
        discount?: number;
        index?: number;
        item_brand?: string;
        item_category?: string;
        item_category2?: string;
        item_category3?: string;
        item_category4?: string;
        item_category5?: string;
        item_list_id?: string;
        item_list_name?: string;
        item_variant?: string;
        location_id?: string;
        price?: number;
        quantity?: number;
      }>;
      transaction_id?: string;
      affiliation?: string;
      currency?: string;
      tax?: number;
      shipping?: number;
      checkout_step?: number;
      checkout_option?: string;
      method?: string;
      search_term?: string;
      content_type?: string;
      content_id?: string;
    },
  ): void;

  (command: 'get', targetId: string, fieldName: string, callback: (value: any) => void): void;
};

export type Group = 'a' | 'b' | 'c' | 'd';
export type PadNumber = `${number}`;
export type PadCode = `${Group}${PadNumber}`;
