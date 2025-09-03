export interface DeviceMetadata {
  chip_id: string;
  mode: string;
  os_version: string;
  product: string;
  serial: string;
  sku: string;
  sw_version: string;
}

export interface Device {
  inputId: string;
  outputId: string;
  name: string;
  sku: string;
  serial: string;
  metadata: DeviceMetadata;
}

export interface SoundMetadata {
  channels: number;
  samplerate: number;
  format: string;
  crc: number;
  'sound.loopstart': number;
  'sound.loopend': number;
  name: string;
  'sound.amplitude': number;
  'sound.playmode': string;
  'sound.pan': number;
  'sound.pitch': number;
  'sound.rootnote': number;
  'time.mode': string;
  'sound.bpm': number;
  'envelope.attack': number;
  'envelope.release': number;
}
