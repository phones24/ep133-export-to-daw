import { XmCell, XmInstrument, XmModule, XmPattern, XmSample } from './types';

const XM_HEADER_SIZE = 336;
const XM_INSTRUMENT_HEADER_SIZE = 263;
const XM_SAMPLE_HEADER_SIZE = 40;

class BinaryWriter {
  readonly data: Uint8Array<ArrayBuffer>;
  private readonly view: DataView;
  private offset = 0;

  constructor(size: number) {
    this.data = new Uint8Array(size);
    this.view = new DataView(this.data.buffer);
  }

  uint8(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
  }

  int8(value: number) {
    this.view.setInt8(this.offset, value);
    this.offset += 1;
  }

  uint16(value: number) {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
  }

  int16(value: number) {
    this.view.setInt16(this.offset, value, true);
    this.offset += 2;
  }

  uint32(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
  }

  ascii(value: string, length: number) {
    for (let i = 0; i < length; i++) {
      if (i >= value.length) {
        this.uint8(0);
        continue;
      }
      const code = value.charCodeAt(i);
      this.uint8(code >= 32 && code <= 126 ? code : 0x3f);
    }
  }

  bytes(value: Uint8Array) {
    this.data.set(value, this.offset);
    this.offset += value.length;
  }
}

function assertModule(module: XmModule) {
  if (module.channels < 2 || module.channels > 32 || module.channels % 2 !== 0) {
    throw new Error('FastTracker 2 modules require an even channel count between 2 and 32');
  }
  if (module.patterns.length < 1 || module.patterns.length > 256) {
    throw new Error('FastTracker 2 modules require between 1 and 256 ordered patterns');
  }
  if (module.instruments.length > 128) {
    throw new Error('FastTracker 2 modules support at most 128 instruments');
  }
  if (module.speed < 1 || module.speed > 31) {
    throw new Error('FastTracker 2 speed must be between 1 and 31');
  }
  if (module.bpm < 32 || module.bpm > 255) {
    throw new Error('FastTracker 2 BPM must be between 32 and 255');
  }
}

function encodeCell(cell: XmCell | undefined, target: number[]) {
  if (!cell) {
    target.push(0x80);
    return;
  }

  let mask = 0x80;
  const values: number[] = [];
  if (cell.note !== undefined) {
    mask |= 0x01;
    values.push(cell.note);
  }
  if (cell.instrument !== undefined) {
    mask |= 0x02;
    values.push(cell.instrument);
  }
  if (cell.volume !== undefined) {
    mask |= 0x04;
    values.push(cell.volume);
  }
  if (cell.effect !== undefined) {
    mask |= 0x08;
    values.push(cell.effect);
  }
  if (cell.effectParameter !== undefined) {
    mask |= 0x10;
    values.push(cell.effectParameter);
  }

  target.push(mask, ...values);
}

function serializePattern(pattern: XmPattern, channels: number) {
  if (pattern.rows < 1 || pattern.rows > 256) {
    throw new Error('XM patterns must contain between 1 and 256 rows');
  }

  const packed: number[] = [];
  for (let row = 0; row < pattern.rows; row++) {
    for (let channel = 0; channel < channels; channel++) {
      encodeCell(pattern.cells.get(row * channels + channel), packed);
    }
  }

  if (packed.length > 65535) {
    throw new Error('XM packed pattern data exceeds 65535 bytes');
  }

  const writer = new BinaryWriter(9 + packed.length);
  writer.uint32(9);
  writer.uint8(0);
  writer.uint16(pattern.rows);
  writer.uint16(packed.length);
  writer.bytes(Uint8Array.from(packed));
  return writer.data;
}

export function deltaEncode16(data: Int16Array) {
  const writer = new BinaryWriter(data.length * 2);
  let previous = 0;
  for (const value of data) {
    writer.int16(value - previous);
    previous = value;
  }
  return writer.data;
}

function serializeSampleHeader(sample: XmSample) {
  if (sample.loopStart < 0 || sample.loopLength < 0) {
    throw new Error('XM sample loop values cannot be negative');
  }
  if (sample.loopStart + sample.loopLength > sample.data.length) {
    throw new Error('XM sample loop exceeds sample data');
  }

  const writer = new BinaryWriter(XM_SAMPLE_HEADER_SIZE);
  writer.uint32(sample.data.length * 2);
  writer.uint32(sample.loopStart * 2);
  writer.uint32(sample.loopLength * 2);
  writer.uint8(sample.volume);
  writer.int8(sample.finetune);
  writer.uint8(0x10 | (sample.loopLength > 0 ? 0x01 : 0));
  writer.uint8(sample.panning);
  writer.int8(sample.relativeNote);
  writer.uint8(0);
  writer.ascii(sample.name, 22);
  return writer.data;
}

function serializeInstrument(instrument: XmInstrument) {
  if (instrument.volumeEnvelope.length > 12) {
    throw new Error('XM volume envelopes support at most 12 points');
  }

  const writer = new BinaryWriter(XM_INSTRUMENT_HEADER_SIZE);
  writer.uint32(XM_INSTRUMENT_HEADER_SIZE);
  writer.ascii(instrument.name, 22);
  writer.uint8(0);
  writer.uint16(1);
  writer.uint32(XM_SAMPLE_HEADER_SIZE);
  writer.bytes(new Uint8Array(96));

  for (let i = 0; i < 12; i++) {
    const point = instrument.volumeEnvelope[i];
    writer.uint16(point?.frame ?? 0);
    writer.uint16(point?.value ?? 0);
  }
  writer.bytes(new Uint8Array(48));
  writer.uint8(instrument.volumeEnvelope.length);
  writer.uint8(0);
  writer.uint8(instrument.volumeSustainPoint);
  writer.uint8(0);
  writer.uint8(0);
  writer.uint8(0);
  writer.uint8(0);
  writer.uint8(0);
  writer.uint8(instrument.volumeEnvelopeType);
  writer.uint8(0);
  writer.uint8(instrument.vibratoType);
  writer.uint8(instrument.vibratoSweep);
  writer.uint8(instrument.vibratoDepth);
  writer.uint8(instrument.vibratoRate);
  writer.uint16(instrument.volumeFadeout);
  writer.bytes(new Uint8Array(22));

  return [
    writer.data,
    serializeSampleHeader(instrument.sample),
    deltaEncode16(instrument.sample.data),
  ];
}

export function serializeXm(module: XmModule) {
  assertModule(module);

  const header = new BinaryWriter(XM_HEADER_SIZE);
  header.ascii('Extended Module: ', 17);
  header.ascii(module.name, 20);
  header.uint8(0x1a);
  header.ascii(module.trackerName, 20);
  header.uint16(0x0104);
  header.uint32(276);
  header.uint16(module.patterns.length);
  header.uint16(0);
  header.uint16(module.channels);
  header.uint16(module.patterns.length);
  header.uint16(module.instruments.length);
  header.uint16(1);
  header.uint16(module.speed);
  header.uint16(module.bpm);
  for (let i = 0; i < 256; i++) {
    header.uint8(i < module.patterns.length ? i : 0);
  }

  const parts: BlobPart[] = [header.data];
  for (const pattern of module.patterns) {
    parts.push(serializePattern(pattern, module.channels));
  }
  for (const instrument of module.instruments) {
    parts.push(...serializeInstrument(instrument));
  }

  return new Blob(parts, { type: 'audio/x-xm' });
}
