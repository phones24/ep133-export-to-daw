const VST_HEADER = [
  109, 111, 115, 114, 238, 94, 237, 254, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0,
  0, 0, 0, 0, 90, 1, 0, 0, 1, 0, 0, 0, 0, 0, 16, 0,
];

const VST_BODY = [
  0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 224, 63, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 154, 153, 153, 153, 153, 153, 177, 63, 205, 204, 204, 204, 204,
  204, 235, 63, 0, 0, 0, 0, 0, 0, 0, 0, 28, 199, 113, 28, 199, 113, 220, 63, 252, 169, 241, 210, 77,
  98, 64, 63, 252, 169, 241, 210, 77, 98, 64, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 224, 63, 1, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 64, 0, 0, 0, 85, 85, 85, 85, 85, 85, 197, 63, 255, 255,
  255, 255, 8, 4, 2, 129, 64, 32, 128, 63, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 240, 63, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 206,
  164, 33, 33, 26, 101, 144, 63, 0, 0, 0, 0, 0, 0, 240, 63, 252, 169, 241, 210, 77, 98, 48, 63, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0,
];

function int32ToBytes(value: number): Uint8Array {
  const bytes = new Uint8Array(4);

  bytes[0] = value & 0xff;
  bytes[1] = (value >> 8) & 0xff;
  bytes[2] = (value >> 16) & 0xff;
  bytes[3] = (value >> 24) & 0xff;

  return bytes;
}

function doubleToBytes(num: number): number[] {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  view.setFloat64(0, num, true);
  const bytes = [];

  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }

  return bytes;
}

function dbToBytes(dbValue: number): number[] {
  // convert dB to linear gain: 10^(dB/20)
  const linearGain = Math.pow(10, dbValue / 20);

  return doubleToBytes(linearGain);
}

function msToBytes(msValue: number, sampleLengthMs: number): number[] {
  const attackNormalized = msValue / 255;
  const maxAttack = sampleLengthMs / 2000;
  const cappedAttackMs = Math.min(attackNormalized, maxAttack);

  return doubleToBytes(cappedAttackMs);
}

function midiNoteToBytes(note: number): number[] {
  return doubleToBytes((note - 40) / 160);
}

function bytesToBase64(bytes: Array<number>): string {
  let binary = '';
  const len = bytes.length;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

export function buildVstState({
  sampleLengthMs,
  filePath,
  volume = 0,
  attack = 0,
  release = 0,
  rootNote = 60,
}: {
  filePath: string;
  sampleLengthMs: number;
  volume?: number;
  attack?: number;
  release?: number;
  rootNote?: number;
}) {
  const encoder = new TextEncoder();
  const bufferHeader = [...VST_HEADER];
  const bufferBody = [...VST_BODY];

  bufferBody.splice(0, 8, ...dbToBytes(volume)); // volume
  bufferBody.splice(72, 8, ...msToBytes(attack, sampleLengthMs)); // atack
  bufferBody.splice(80, 8, ...msToBytes(release, sampleLengthMs)); // release
  bufferBody.splice(40, 8, ...midiNoteToBytes(rootNote)); // root note
  bufferBody.splice(88, 8, ...doubleToBytes(1)); // obey note off
  bufferBody[128] = 2; // play mode: key

  const fullBody = [...encoder.encode(filePath), 0, ...bufferBody];

  bufferHeader.splice(32, 4, ...int32ToBytes(fullBody.length));

  return {
    header: bytesToBase64(bufferHeader),
    body: bytesToBase64(fullBody),
  };
}
