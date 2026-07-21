import { FaderParam, Pad, Sound, TimeSignature } from '../../../types/types';
import { XmEnvelopePoint, XmInstrument, XmSample } from './types';

export type PreparedXmInstrument = {
  padCode: string;
  number: number;
  sourceRate: number;
  sampleFrames: number;
  relativeNote: number;
  finetune: number;
  loops: boolean;
  rootNote: number;
  attackTicks: number;
  releaseTicks: number;
  instrument: XmInstrument;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function decodePcmToMono16(
  pcm: Uint8Array,
  format: Sound['meta']['format'],
  channels: number,
) {
  if (channels < 1) {
    throw new Error('PCM data must contain at least one channel');
  }

  const bytesPerSample = format === 's16' ? 2 : format === 's24' ? 3 : 4;
  const frameSize = bytesPerSample * channels;
  const frames = Math.floor(pcm.length / frameSize);
  const result = new Int16Array(frames);
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);

  for (let frame = 0; frame < frames; frame++) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel++) {
      const offset = frame * frameSize + channel * bytesPerSample;
      if (format === 's16') {
        sum += view.getInt16(offset, true) / 32768;
      } else if (format === 's24') {
        const raw =
          view.getUint8(offset) |
          (view.getUint8(offset + 1) << 8) |
          (view.getUint8(offset + 2) << 16);
        sum += (raw & 0x800000 ? raw - 0x1000000 : raw) / 8388608;
      } else {
        const value = view.getFloat32(offset, true);
        sum += Number.isFinite(value) ? value : 0;
      }
    }

    const mixed = clamp(sum / channels, -1, 1);
    result[frame] = clamp(Math.round(mixed * 32768), -32768, 32767);
  }

  return result;
}

export function encodeXmTuning(sampleRate: number, rootNote: number, pitch: number) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error(`Invalid sample rate: ${sampleRate}`);
  }
  if (!Number.isFinite(rootNote) || rootNote < 1 || rootNote > 127) {
    throw new Error(`Invalid sample root note: ${rootNote}`);
  }
  if (!Number.isFinite(pitch)) {
    throw new Error(`Invalid sample pitch: ${pitch}`);
  }

  const semitones = 60 - rootNote + 12 * Math.log2(sampleRate / 8363) + pitch;
  const requestedUnits = Math.round(semitones * 16);
  const units = clamp(requestedUnits, -1552, 1535);
  const relativeNote = clamp(Math.trunc(units / 16), -96, 95);
  const finetune = 8 * (units - relativeNote * 16);
  return { relativeNote, finetune };
}

function trimAndReverse(data: Int16Array, pad: Pad) {
  const start = clamp(Math.round(pad.trimLeft), 0, data.length);
  const requestedEnd = pad.trimRight > start ? Math.round(pad.trimRight) : data.length;
  const end = clamp(requestedEnd, start, data.length);
  const result = data.slice(start, end);

  if (pad.timeStretch === 'rev') {
    result.reverse();
  }

  return { data: result, start, end };
}

function getLoop(sound: Sound, pad: Pad, trimStart: number, trimEnd: number, length: number) {
  if (sound.meta['sound.playmode'] !== 'loop') {
    return { loopStart: 0, loopLength: 0 };
  }

  const sourceStart = clamp(Math.round(sound.meta['sound.loopstart']), trimStart, trimEnd);
  const sourceEnd = clamp(Math.round(sound.meta['sound.loopend']), sourceStart, trimEnd);
  let loopStart = sourceStart - trimStart;
  let loopEnd = sourceEnd - trimStart;

  if (pad.timeStretch === 'rev') {
    const reversedStart = length - loopEnd;
    loopEnd = length - loopStart;
    loopStart = reversedStart;
  }

  const loopLength = loopEnd - loopStart;
  if (loopLength < 2) {
    return { loopStart: 0, loopLength: 0 };
  }

  return { loopStart, loopLength };
}

function envelopeTicks(value: number, sampleSeconds: number, bpm: number) {
  if (value <= 0 || sampleSeconds <= 0) {
    return 0;
  }
  return clamp(Math.round(((value / 255) * sampleSeconds * bpm) / 2.5), 1, 324);
}

function buildEnvelope(
  gated: boolean,
  sampleSeconds: number,
  bpm: number,
  attackValue: number,
  releaseValue: number,
) {
  const attackTicks = envelopeTicks(attackValue, sampleSeconds, bpm);
  const requestedReleaseTicks = envelopeTicks(releaseValue, sampleSeconds, bpm);
  const points: XmEnvelopePoint[] =
    attackTicks > 0
      ? [
          { frame: 0, value: 0 },
          { frame: attackTicks, value: 64 },
        ]
      : [{ frame: 0, value: 64 }];
  const sustainPoint = points.length - 1;
  const releaseTicks = gated
    ? Math.min(requestedReleaseTicks, 324 - points[sustainPoint].frame)
    : 0;
  if (gated && releaseTicks > 0) {
    points.push({ frame: points[sustainPoint].frame + releaseTicks, value: 0 });
  }
  const type = gated ? 3 : attackTicks > 0 ? 1 : 0;
  return { points, sustainPoint, type, attackTicks, releaseTicks };
}

function getPitchFader(pad: Pad, faders: Record<FaderParam, number>) {
  let pitch = pad.pitch;
  if (faders[FaderParam.PTC] !== -1) {
    pitch += (faders[FaderParam.PTC] - 0.5) * 10;
  }
  if (faders[FaderParam.TUNE] !== -1) {
    pitch += faders[FaderParam.TUNE] * 24 - 12;
  }
  return pitch;
}

export function stretchSemitones(
  pad: Pad,
  sampleFrames: number,
  sampleRate: number,
  bpm: number,
  timeSignature: TimeSignature,
) {
  if (pad.timeStretch === 'bpm' && pad.timeStretchBpm > 0) {
    return 12 * Math.log2(bpm / pad.timeStretchBpm);
  }
  if (pad.timeStretch === 'bars' && pad.timeStretchBars > 0) {
    const quarterNotesPerBar = (4 / timeSignature.denominator) * timeSignature.numerator;
    const targetSeconds = (pad.timeStretchBars * quarterNotesPerBar * 60) / bpm;
    const originalSeconds = sampleFrames / sampleRate;
    if (targetSeconds <= 0 || originalSeconds <= 0) {
      return 0;
    }
    return 12 * Math.log2(originalSeconds / targetSeconds);
  }
  return 0;
}

export function prepareXmInstrument({
  padCode,
  number,
  pad,
  sound,
  pcm,
  faders,
  bpm,
  timeSignature,
}: {
  padCode: string;
  number: number;
  pad: Pad;
  sound: Sound;
  pcm: Uint8Array;
  faders: Record<FaderParam, number>;
  bpm: number;
  timeSignature: TimeSignature;
}): PreparedXmInstrument {
  const decoded = decodePcmToMono16(pcm, sound.meta.format, sound.meta.channels);
  const trimmed = trimAndReverse(decoded, pad);
  if (trimmed.data.length === 0) {
    throw new Error(`Pad ${padCode} has an empty sample after trimming`);
  }

  const sampleSeconds = trimmed.data.length / sound.meta.samplerate;
  const attackValue = faders[FaderParam.ATK] !== -1 ? faders[FaderParam.ATK] * 255 : pad.attack;
  const releaseValue = faders[FaderParam.REL] !== -1 ? faders[FaderParam.REL] * 255 : pad.release;
  const stretch = stretchSemitones(
    pad,
    trimmed.data.length,
    sound.meta.samplerate,
    bpm,
    timeSignature,
  );
  const pitch = getPitchFader(pad, faders) + Number(sound.meta['sound.pitch'] ?? 0) + stretch;
  const soundRootNote = sound.meta['sound.rootnote'];
  const rootNote =
    Number.isFinite(pad.rootNote) && pad.rootNote >= 1 && pad.rootNote <= 127
      ? pad.rootNote
      : Number.isFinite(soundRootNote) && soundRootNote >= 1 && soundRootNote <= 127
        ? soundRootNote
        : 60;
  const tuning = encodeXmTuning(sound.meta.samplerate, rootNote, pitch);
  const loop = getLoop(sound, pad, trimmed.start, trimmed.end, trimmed.data.length);
  const envelope = buildEnvelope(
    pad.playMode !== 'oneshot' || loop.loopLength > 0,
    sampleSeconds,
    bpm,
    attackValue,
    releaseValue,
  );
  const level =
    faders[FaderParam.LVL] !== -1
      ? Math.min(pad.volume / 200, faders[FaderParam.LVL])
      : pad.volume / 200;
  const amplitude = (Number(sound.meta['sound.amplitude']) || 100) / 100;
  const volume = clamp(Math.round(64 * level * amplitude), 0, 64);
  const pan = faders[FaderParam.PAN] !== -1 ? (faders[FaderParam.PAN] - 0.5) * 2 : pad.pan;

  const sample: XmSample = {
    name: sound.meta.name || padCode,
    data: trimmed.data,
    loopStart: loop.loopStart,
    loopLength: loop.loopLength,
    volume,
    finetune: tuning.finetune,
    panning: clamp(Math.round((pan + 1) * 127.5), 0, 255),
    relativeNote: tuning.relativeNote,
  };

  return {
    padCode,
    number,
    sourceRate: sound.meta.samplerate,
    sampleFrames: sample.data.length,
    relativeNote: sample.relativeNote,
    finetune: sample.finetune,
    loops: sample.loopLength > 0,
    rootNote,
    attackTicks: envelope.attackTicks,
    releaseTicks: envelope.releaseTicks,
    instrument: {
      name: `${padCode.toUpperCase()} ${sound.meta.name || 'sample'}`,
      sample,
      volumeEnvelope: envelope.points,
      volumeSustainPoint: envelope.sustainPoint,
      volumeEnvelopeType: envelope.type,
      vibratoType: 0,
      vibratoSweep: 0,
      vibratoDepth: 0,
      vibratoRate: 0,
      volumeFadeout: 0,
    },
  };
}
