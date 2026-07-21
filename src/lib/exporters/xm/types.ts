export type XmCell = {
  note?: number;
  instrument?: number;
  volume?: number;
  effect?: number;
  effectParameter?: number;
};

export type XmPattern = {
  rows: number;
  cells: Map<number, XmCell>;
};

export type XmEnvelopePoint = {
  frame: number;
  value: number;
};

export type XmSample = {
  name: string;
  data: Int16Array;
  loopStart: number;
  loopLength: number;
  volume: number;
  finetune: number;
  panning: number;
  relativeNote: number;
};

export type XmInstrument = {
  name: string;
  sample: XmSample;
  volumeEnvelope: XmEnvelopePoint[];
  volumeSustainPoint: number;
  volumeEnvelopeType: number;
  vibratoType: number;
  vibratoSweep: number;
  vibratoDepth: number;
  vibratoRate: number;
  volumeFadeout: number;
};

export type XmModule = {
  name: string;
  trackerName: string;
  channels: number;
  speed: number;
  bpm: number;
  patterns: XmPattern[];
  instruments: XmInstrument[];
};
