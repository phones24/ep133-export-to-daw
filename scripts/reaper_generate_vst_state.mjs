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

function int32ToLEBytes(value) {
  const bytes = new Uint8Array(4);
  bytes[0] = value & 0xff;
  bytes[1] = (value >> 8) & 0xff;
  bytes[2] = (value >> 16) & 0xff;
  bytes[3] = (value >> 24) & 0xff;
  return bytes;
}
function bytesToDouble(bytes) {
  if (bytes.length !== 8) {
    throw new Error('Expected 8 bytes');
  }
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  bytes.forEach((b, i) => view.setUint8(i, b));
  return view.getFloat64(0, true);
}

function doubleToBytes(num) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, num, true);
  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function paramToBytes(paramValue) {
  const normalizedValue = paramValue / 250.0;

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, normalizedValue, true);

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function dbToBytes(dbValue) {
  const linearGain = Math.pow(10, dbValue / 20);

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, linearGain, true);

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function msToBytes(msValue, sampleLengthMs) {
  const normalizedValue = msValue / sampleLengthMs;

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, normalizedValue, true);

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function bytesToString(bytes) {
  return bytes.reduce((acc, byte, index) => {
    return `${acc + String(index).padStart(3, '0')}  ${byte}\n`;
  }, '');
}

function buildVstState({ filePath, volume = -6, attack = 10, release = 10 }) {
  const encoder = new TextEncoder();
  const bufferHeader = VST_HEADER;
  const bufferBody = [...VST_BODY];

  // console.log(cut.length);

  // console.dir(bufferHeader, { maxArrayLength: null, compact: false });
  // console.dir(Buffer.from(bufferBody).toString('utf8'), { maxArrayLength: null, compact: fal 6y5a  -O0se });

  // const decoder = new TextDecoder('utf-8'); // Specify the encoding, e.g., 'utf-8'
  // console.log(decoder.decode(new Uint8Array(VST_BODY)));
  // console.log(decoder.decode(new Uint8Array(cut)));

  bufferBody.splice(0, 8, ...dbToBytes(volume));
  // bufferBody.splice(8, 8, ...dbToBytes(5));
  // bufferBody.splice(16, 8, ...dbToBytes()); // min volume
  bufferBody.splice(72, 8, ...msToBytes(attack, 920)); // atack
  bufferBody.splice(80, 8, ...msToBytes(release, 920)); // release

  // console.dir(bufferBody, { maxArrayLength: null, compact: false });
  console.log(bytesToString(bufferBody));

  const fullBody = [...encoder.encode(filePath), 0, ...bufferBody];

  bufferHeader.splice(32, 4, ...int32ToLEBytes(fullBody.length));

  return {
    header: Buffer.from(bufferHeader).toString('base64'),
    body: Buffer.from(fullBody).toString('base64'),
  };
}

const result = buildVstState({
  filePath: 'Media/BD B 808 Decay C 02.wav',
  // filePath: 'Media/600 veh2 percussive .wav',
});

console.log('        ' + result.header);
console.log('        ' + result.body);
