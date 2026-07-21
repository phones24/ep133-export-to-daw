import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodePcmToMono16,
  encodeXmTuning,
  type PreparedXmInstrument,
  prepareXmInstrument,
  stretchSemitones,
} from '../src/lib/exporters/xm/samples';
import type { XmInstrument, XmModule } from '../src/lib/exporters/xm/types';
import { deltaEncode16, serializeXm } from '../src/lib/exporters/xm/writer';
import { collectSettings, decodePadPitch } from '../src/lib/parsers';
import { xmTransform } from '../src/lib/transformers/xm';
import { TarFile } from '../src/lib/untar';
import { FaderParam, type Pad, type ProjectRawData, type Sound } from '../src/types/types';

function decodeDelta16(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const result: number[] = [];
  let value = 0;
  for (let offset = 0; offset < data.length; offset += 2) {
    value = ((value + view.getInt16(offset, true)) << 16) >> 16;
    result.push(value);
  }
  return result;
}

function makeInstrument(data = new Int16Array([1000, 1500, -500])): XmInstrument {
  return {
    name: 'Instrument',
    sample: {
      name: 'Sample',
      data,
      loopStart: 0,
      loopLength: 0,
      volume: 64,
      finetune: 0,
      panning: 128,
      relativeNote: 0,
    },
    volumeEnvelope: [],
    volumeSustainPoint: 0,
    volumeEnvelopeType: 0,
    vibratoType: 0,
    vibratoSweep: 0,
    vibratoDepth: 0,
    vibratoRate: 0,
    volumeFadeout: 0,
  };
}

function makePad(): Pad {
  return {
    pad: 1,
    name: 'Kick',
    group: 'a',
    file: null,
    rawData: null,
    soundId: 1,
    volume: 200,
    attack: 0,
    release: 0,
    trimLeft: 0,
    trimRight: 3,
    soundLength: 1,
    playMode: 'oneshot',
    pan: 0,
    pitch: 0,
    rootNote: 60,
    timeStretch: 'off',
    timeStretchBpm: 0,
    timeStretchBars: 0,
    inChokeGroup: false,
    midiChannel: 0,
  };
}

function makeFaders() {
  return Object.fromEntries(
    Object.values(FaderParam)
      .filter((value) => typeof value === 'number')
      .map((value) => [value, -1]),
  ) as Record<FaderParam, number>;
}

function xmPlaybackRate(midiNote: number, relativeNote: number, finetune: number) {
  const diskNote = midiNote - 11;
  return 8363 * 2 ** ((diskNote - 1 + relativeNote - 48 + finetune / 128) / 12);
}

function pitchErrorInCents(actual: number, expected: number) {
  return 1200 * Math.log2(actual / expected);
}

test('decodes signed pad pitch cents', () => {
  assert.equal(decodePadPitch(0, 3), 0.03);
  assert.equal(decodePadPitch(0, 254), -0.02);
  assert.equal(decodePadPitch(250, 31), -5.69);
  assert.equal(decodePadPitch(1, 239), 0.83);
});

test('preserves full PTC and TUNE fader precision', () => {
  const rawData = new Uint8Array(224);
  const view = new DataView(rawData.buffer);
  view.setFloat32(4, 120, true);
  view.setFloat32(24 + FaderParam.PTC * 4, 0.583, true);
  view.setFloat32(24 + FaderParam.TUNE * 4, 0.513, true);
  const settings = collectSettings([new TarFile('settings', rawData.length, rawData)]);
  assert.equal(settings.groupFaderParams.a[FaderParam.PTC], Math.fround(0.583));
  assert.equal(settings.groupFaderParams.a[FaderParam.TUNE], Math.fround(0.513));
});

test('delta-encodes signed 16-bit PCM', () => {
  const source = new Int16Array([1000, 1500, -500, 32767, -32768]);
  const encoded = deltaEncode16(source);
  assert.deepEqual(decodeDelta16(encoded), [...source]);
});

test('decodes and downmixes interleaved PCM', () => {
  const pcm = new Uint8Array(8);
  const view = new DataView(pcm.buffer);
  view.setInt16(0, 32767, true);
  view.setInt16(2, -32768, true);
  view.setInt16(4, 16384, true);
  view.setInt16(6, 16384, true);
  assert.deepEqual([...decodePcmToMono16(pcm, 's16', 2)], [0, 16384]);

  const pcm24 = new Uint8Array([0xff, 0xff, 0x7f, 0, 0, 0x80]);
  assert.deepEqual([...decodePcmToMono16(pcm24, 's24', 1)], [32767, -32768]);

  const floatPcm = new Uint8Array(8);
  const floatView = new DataView(floatPcm.buffer);
  floatView.setFloat32(0, 0.5, true);
  floatView.setFloat32(4, -0.5, true);
  assert.deepEqual([...decodePcmToMono16(floatPcm, 'float', 2)], [0]);
});

test('encodes source rate and root note as FT2 tuning', () => {
  assert.deepEqual(encodeXmTuning(8363, 60, 0), {
    relativeNote: 0,
    finetune: 0,
  });
  const tuning = encodeXmTuning(44100, 60, 0);
  assert.equal(tuning.relativeNote, 28);
  assert.equal(tuning.finetune, 104);

  const nonCRootTuning = encodeXmTuning(46875, 29, 0.03);
  const actualRate = xmPlaybackRate(29, nonCRootTuning.relativeNote, nonCRootTuning.finetune);
  const expectedRate = 46875 * 2 ** (0.03 / 12);
  assert.equal(Math.abs(pitchErrorInCents(actualRate, expectedRate)) <= 3.125, true);
  assert.throws(() => encodeXmTuning(8363, 60, Number.NaN), /Invalid sample pitch/);
});

test('prefers a valid pad root and falls back to the sample root', () => {
  const pcm = new Uint8Array(6);
  const sound = {
    id: 1,
    fileNode: { nodeId: 1, flags: 0, fileSize: 6, fileName: 'Rooted', fileType: 'file' },
    meta: {
      channels: 1,
      samplerate: 8363,
      format: 's16',
      crc: 0,
      name: 'Rooted',
      'sound.loopstart': 0,
      'sound.loopend': 0,
      'sound.amplitude': 100,
      'sound.playmode': 'oneshot',
      'sound.pan': 0,
      'sound.pitch': 0.2,
      'sound.rootnote': 60,
      'time.mode': '',
      'sound.bpm': 0,
      'envelope.attack': 0,
      'envelope.release': 0,
    },
  } satisfies Sound;
  const pad = makePad();
  pad.rootNote = 48;
  pad.pitch = decodePadPitch(0, 3);
  const faders = makeFaders();
  faders[FaderParam.PTC] = 0.583;
  faders[FaderParam.TUNE] = 0.51;
  const prepared = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders,
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  const actualRate = xmPlaybackRate(
    48,
    prepared.instrument.sample.relativeNote,
    prepared.instrument.sample.finetune,
  );
  const expectedRate = 8363 * 2 ** (1.3 / 12);
  assert.equal(prepared.rootNote, 48);
  assert.equal(Math.abs(pitchErrorInCents(actualRate, expectedRate)) <= 3.125, true);

  pad.rootNote = 0;
  sound.meta['sound.rootnote'] = 55;
  const fallback = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders: makeFaders(),
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  assert.equal(fallback.rootNote, 55);

  sound.meta['sound.rootnote'] = 0;
  const defaultRoot = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders: makeFaders(),
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  assert.equal(defaultRoot.rootNote, 60);
});

test('shifts pitch so bars/bpm-stretched samples fit the target duration', () => {
  const sampleRate = 46875;
  const bpm = 120;
  const timeSignature = { numerator: 4, denominator: 4 };
  const oneBarSeconds = (4 * 60) / bpm;

  const pad = makePad();
  pad.timeStretch = 'bars';
  pad.timeStretchBars = 1;

  const framesForOneBar = Math.round(sampleRate * oneBarSeconds);
  assert.equal(stretchSemitones(pad, framesForOneBar, sampleRate, bpm, timeSignature), 0);

  const framesForHalfBar = Math.round(sampleRate * oneBarSeconds * 0.5);
  const halfBarStretch = stretchSemitones(pad, framesForHalfBar, sampleRate, bpm, timeSignature);
  assert.equal(Math.abs(halfBarStretch - -12) < 0.001, true);

  pad.timeStretch = 'bpm';
  pad.timeStretchBpm = 90;
  assert.equal(
    Math.abs(stretchSemitones(pad, framesForOneBar, sampleRate, bpm, timeSignature) - 4.98) < 0.01,
    true,
  );
});

test('prepares reversed looped instruments with gated release envelopes', () => {
  const pad = makePad();
  pad.playMode = 'key';
  pad.release = 255;
  pad.trimRight = 4;
  pad.timeStretch = 'rev';
  const pcm = new Uint8Array(8);
  const view = new DataView(pcm.buffer);
  [1, 2, 3, 4].forEach((value, index) => {
    view.setInt16(index * 2, value, true);
  });
  const sound = {
    id: 1,
    fileNode: { nodeId: 1, flags: 0, fileSize: 8, fileName: 'Loop', fileType: 'file' },
    meta: {
      channels: 1,
      samplerate: 4,
      format: 's16',
      crc: 0,
      name: 'Loop',
      'sound.loopstart': 1,
      'sound.loopend': 3,
      'sound.amplitude': 100,
      'sound.playmode': 'loop',
      'sound.pan': 0,
      'sound.pitch': 0,
      'sound.rootnote': 60,
      'time.mode': '',
      'sound.bpm': 0,
      'envelope.attack': 0,
      'envelope.release': 0,
    },
  } satisfies Sound;
  const prepared = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders: makeFaders(),
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });

  assert.deepEqual([...prepared.instrument.sample.data], [4, 3, 2, 1]);
  assert.equal(prepared.instrument.sample.loopStart, 1);
  assert.equal(prepared.instrument.sample.loopLength, 2);
  assert.equal(prepared.instrument.volumeEnvelopeType, 3);
  assert.deepEqual(prepared.instrument.volumeEnvelope, [
    { frame: 0, value: 64 },
    { frame: 48, value: 0 },
  ]);
  assert.equal(prepared.releaseTicks, 48);
});

test('derives sample volume from pad level, LVL fader and amplitude percentage', () => {
  const pad = makePad();
  pad.volume = 100;
  const sound = {
    id: 1,
    fileNode: { nodeId: 1, flags: 0, fileSize: 6, fileName: 'S', fileType: 'file' },
    meta: {
      channels: 1,
      samplerate: 8363,
      format: 's16',
      crc: 0,
      name: 'S',
      'sound.loopstart': 0,
      'sound.loopend': 0,
      'sound.amplitude': 100,
      'sound.playmode': 'oneshot',
      'sound.pan': 0,
      'sound.pitch': 0,
      'sound.rootnote': 60,
      'time.mode': '',
      'sound.bpm': 0,
      'envelope.attack': 0,
      'envelope.release': 0,
    },
  } satisfies Sound;
  const pcm = new Uint8Array(6);

  const base = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders: makeFaders(),
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  assert.equal(base.instrument.sample.volume, 32);

  pad.volume = 200;
  sound.meta['sound.amplitude'] = 200;
  const boosted = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders: makeFaders(),
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  assert.equal(boosted.instrument.sample.volume, 64);

  pad.volume = 100;
  sound.meta['sound.amplitude'] = 100;
  const faders = makeFaders();
  faders[FaderParam.LVL] = 0.25;
  const faderAttenuated = prepareXmInstrument({
    padCode: 'a0',
    number: 1,
    pad,
    sound,
    pcm,
    faders,
    bpm: 120,
    timeSignature: { numerator: 4, denominator: 4 },
  });
  assert.equal(faderAttenuated.instrument.sample.volume, 16);
});

test('serializes an XM 1.04 module with a sampled instrument', async () => {
  const module: XmModule = {
    name: 'Test',
    trackerName: 'EP133 to DAW',
    channels: 2,
    speed: 6,
    bpm: 125,
    patterns: [
      {
        rows: 1,
        cells: new Map([[0, { note: 49, instrument: 1, volume: 0x50 }]]),
      },
    ],
    instruments: [makeInstrument()],
  };

  const bytes = new Uint8Array(await serializeXm(module).arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(new TextDecoder().decode(bytes.subarray(0, 17)), 'Extended Module: ');
  assert.equal(view.getUint16(58, true), 0x0104);
  assert.equal(view.getUint32(60, true), 276);
  assert.equal(view.getUint16(68, true), 2);
  assert.equal(view.getUint16(76, true), 6);
  assert.equal(view.getUint16(78, true), 125);
  assert.equal(view.getUint32(336, true), 9);
  assert.equal(view.getUint16(343, true), 5);

  const instrumentOffset = 350;
  const sampleHeaderOffset = instrumentOffset + 263;
  const sampleDataOffset = sampleHeaderOffset + 40;
  assert.equal(view.getUint32(instrumentOffset, true), 263);
  assert.equal(view.getUint16(instrumentOffset + 27, true), 1);
  assert.equal(view.getUint32(sampleHeaderOffset, true), 6);
  assert.equal(view.getUint8(sampleHeaderOffset + 14), 0x10);
  assert.deepEqual(decodeDelta16(bytes.subarray(sampleDataOffset)), [1000, 1500, -500]);
});

test('keeps each pad on one XM channel while repeating patterns', () => {
  const pad = makePad();
  const sound = {
    id: 1,
    fileNode: { nodeId: 1, flags: 0, fileSize: 6, fileName: 'Kick', fileType: 'file' },
    meta: {
      channels: 1,
      samplerate: 8363,
      format: 's16',
      crc: 0,
      name: 'Kick',
      'sound.loopstart': 0,
      'sound.loopend': 0,
      'sound.amplitude': 100,
      'sound.playmode': 'oneshot',
      'sound.pan': 0,
      'sound.pitch': 0,
      'sound.rootnote': 60,
      'time.mode': '',
      'sound.bpm': 0,
      'envelope.attack': 0,
      'envelope.release': 0,
    },
  } satisfies Sound;
  const faders = makeFaders();
  const data = {
    pads: { a: [pad], b: [], c: [], d: [] },
    scenes: [
      {
        name: '01',
        patterns: [
          {
            pad: 'a0',
            group: 'a',
            bars: 1,
            notes: [{ note: 60, position: 4, duration: 24, velocity: 127 }],
          },
          { pad: 'a1', group: 'a', bars: 2, notes: [] },
        ],
      },
    ],
    settings: {
      bpm: 120,
      scale: 0,
      rootNote: 60,
      groupFaderParams: { a: faders, b: makeFaders(), c: makeFaders(), d: makeFaders() },
      faderAssignment: {},
      rawData: new Uint8Array(),
    },
    effects: { rawData: new Uint8Array(), effectType: 0, param1: 0, param2: 0 },
    sounds: [sound],
    projectFile: {} as File,
    scenesSettings: { timeSignature: { numerator: 4, denominator: 4 } },
  } satisfies ProjectRawData;
  const prepared: PreparedXmInstrument = {
    padCode: 'a0',
    number: 1,
    sourceRate: 8363,
    sampleFrames: 1000,
    relativeNote: 0,
    finetune: 0,
    loops: false,
    rootNote: 60,
    attackTicks: 0,
    releaseTicks: 0,
    instrument: makeInstrument(new Int16Array(1000)),
  };
  prepared.instrument.sample.volume = 32;

  const result = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.equal(result.channels, 2);
  assert.equal(result.patterns[0].rows, 32);
  assert.deepEqual(result.patterns[0].cells.get(0), {
    note: 49,
    instrument: 1,
    volume: 0x30,
    effect: 0x0e,
    effectParameter: 0xd1,
  });
  assert.deepEqual(result.patterns[0].cells.get(16 * 2), {
    note: 49,
    instrument: 1,
    volume: 0x30,
    effect: 0x0e,
    effectParameter: 0xd1,
  });
  assert.equal(
    [...result.patterns[0].cells]
      .filter(([, cell]) => cell.instrument !== undefined)
      .every(([cellIndex]) => cellIndex % result.channels === 0),
    true,
  );

  pad.playMode = 'key';
  data.scenes[0].patterns[0].notes = [{ note: 60, position: 0, duration: 4, velocity: 127 }];
  const keyResult = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.deepEqual(keyResult.patterns[0].cells.get(0), {
    note: 49,
    instrument: 1,
    volume: 0x30,
    effect: 0x0e,
    effectParameter: 0xc1,
  });

  pad.playMode = 'oneshot';
  data.scenes[0].patterns[0].notes = [{ note: 60, position: 383, duration: 4, velocity: 127 }];
  const boundaryResult = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.deepEqual(boundaryResult.patterns[0].cells.get(15 * 2), {
    note: 49,
    instrument: 1,
    volume: 0x30,
    effect: 0x0e,
    effectParameter: 0xd5,
  });

  prepared.sampleFrames = 1000;
  data.scenes[0].patterns[0].notes = [
    { note: 60, position: 0, duration: 24, velocity: 127 },
    { note: 64, position: 0, duration: 24, velocity: 127 },
    { note: 67, position: 0, duration: 24, velocity: 127 },
    { note: 72, position: 0, duration: 24, velocity: 127 },
  ];
  pad.playMode = 'oneshot';
  const oneshotChordResult = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.equal(oneshotChordResult.channels, 2);
  const oneshotStartChannels = new Set(
    [...oneshotChordResult.patterns[0].cells.entries()]
      .filter(
        ([, cell]) => cell.note !== undefined && cell.note !== 97 && cell.instrument !== undefined,
      )
      .map(([index]) => index % oneshotChordResult.channels),
  );
  assert.equal(oneshotStartChannels.size, 1);

  pad.playMode = 'key';
  const chordResult = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.equal(chordResult.channels, 4);
  const startCells = [...chordResult.patterns[0].cells.entries()]
    .filter(([index, cell]) => cell.note !== undefined && cell.note !== 97 && index < 32)
    .map(([index, cell]) => ({ channel: index % chordResult.channels, note: cell.note }));
  assert.equal(new Set(startCells.map((cell) => cell.channel)).size, 4);
  assert.equal(new Set(startCells.map((cell) => cell.note)).size, 4);

  data.scenes[0].patterns[0].notes = Array.from({ length: 33 }, () => ({
    note: 60,
    position: 0,
    duration: 24,
    velocity: 127,
  }));
  prepared.sampleFrames = 100000;
  assert.throws(
    () =>
      xmTransform({
        data,
        instruments: new Map([['a0', prepared]]),
        speed: 6,
        bpm: 120,
      }),
    /32 available channels/,
  );
});

test('keeps sequential legato notes on a single channel despite release overlap', () => {
  const pad = makePad();
  pad.playMode = 'legato';
  pad.release = 255;
  const sound = {
    id: 1,
    fileNode: { nodeId: 1, flags: 0, fileSize: 8, fileName: 'Bass', fileType: 'file' },
    meta: {
      channels: 1,
      samplerate: 8363,
      format: 's16',
      crc: 0,
      name: 'Bass',
      'sound.loopstart': 0,
      'sound.loopend': 0,
      'sound.amplitude': 100,
      'sound.playmode': 'oneshot',
      'sound.pan': 0,
      'sound.pitch': 0,
      'sound.rootnote': 60,
      'time.mode': '',
      'sound.bpm': 0,
      'envelope.attack': 0,
      'envelope.release': 0,
    },
  } satisfies Sound;
  const data = {
    pads: { a: [pad], b: [], c: [], d: [] },
    scenes: [
      {
        name: '01',
        patterns: [
          {
            pad: 'a0',
            group: 'a',
            bars: 1,
            notes: [
              { note: 60, position: 0, duration: 24, velocity: 127 },
              { note: 62, position: 24, duration: 24, velocity: 127 },
              { note: 64, position: 48, duration: 24, velocity: 127 },
            ],
          },
        ],
      },
    ],
    settings: {
      bpm: 120,
      scale: 0,
      rootNote: 60,
      groupFaderParams: {
        a: makeFaders(),
        b: makeFaders(),
        c: makeFaders(),
        d: makeFaders(),
      },
      faderAssignment: {},
      rawData: new Uint8Array(),
    },
    effects: { rawData: new Uint8Array(), effectType: 0, param1: 0, param2: 0 },
    sounds: [sound],
    projectFile: {} as File,
    scenesSettings: { timeSignature: { numerator: 4, denominator: 4 } },
  } satisfies ProjectRawData;
  const prepared: PreparedXmInstrument = {
    padCode: 'a0',
    number: 1,
    sourceRate: 8363,
    sampleFrames: 100000,
    relativeNote: 0,
    finetune: 0,
    loops: false,
    rootNote: 60,
    attackTicks: 0,
    releaseTicks: 48,
    instrument: makeInstrument(new Int16Array(100000)),
  };

  const result = xmTransform({
    data,
    instruments: new Map([['a0', prepared]]),
    speed: 6,
    bpm: 120,
  });
  assert.equal(result.channels, 2);
  const usedChannels = new Set(
    [...result.patterns[0].cells.entries()]
      .filter(([, cell]) => cell.instrument !== undefined)
      .map(([index]) => index % result.channels),
  );
  assert.equal(usedChannels.size, 1);
});
