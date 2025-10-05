export type TEDeviceMetadata = {
  chip_id: string;
  mode: string;
  os_version: string;
  product: string;
  serial: string;
  sku: string;
  sw_version: string;
};

export type TESysexMessage = {
  kind: 'te-sysex';
  identityCode: number;
  requestId: number;
  hasRequestId: boolean;
  status: number;
  hStatus: string;
  command: number;
  type: 'request' | 'response';
  rawData: Uint8Array;
  hexData: string;
  hexCommand: string;
  string: string;
};

export type TEFileListEntry = {
  nodeId: number;
  flags: number;
  fileSize: number;
  fileName: string;
  fileType: 'file' | 'folder';
};

export type TEGetFileResponse = {
  name: string;
  size: number;
  data: Uint8Array[];
  crc32?: number;
};

export type TEDeviceIdentification = {
  id: number;
  sku: string;
};

export interface TEDevice {
  inputId: string;
  outputId: string;
  sku: string;
  serial: string;
  metadata: TEDeviceMetadata;
}

export type TESoundMetadata = {
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
