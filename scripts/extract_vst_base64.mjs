import fs from 'node:fs';

const VST_HEADER = [
  109, 111, 115, 114, 238, 94, 237, 254, 0, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0,
  0, 0, 0, 0, 90, 1, 0, 0, 1, 0, 0, 0, 0, 0, 16, 0,
];

const VST_BODY = [
  0, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 224, 63, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 154, 153, 153, 153, 153, 153, 177, 63, 205, 204, 204, 204,
  204, 204, 235, 63, 0, 0, 0, 0, 0, 0, 0, 0, 28, 199, 113, 28, 199, 113, 220, 63, 252, 169, 241,
  210, 77, 98, 64, 63, 252, 169, 241, 210, 77, 98, 64, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 224, 63, 1, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 240, 63, 64, 0, 0, 0, 85, 85, 85, 85, 85, 85, 197, 63, 255,
  255, 255, 255, 8, 4, 2, 129, 64, 32, 128, 63, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 240,
  63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 206, 164, 33, 33, 26, 101, 144, 63, 0, 0, 0, 0, 0, 0, 240, 63, 252, 169, 241, 210, 77, 98, 48,
  63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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
  return view.getFloat64(0, true); // true = little-endian
}

function doubleToBytes(num) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, num, true); // true = little-endian
  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function paramToBytes(paramValue) {
  // Normalize the parameter value (0-100 range becomes 0.0-0.4)
  const normalizedValue = paramValue / 250.0;

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, normalizedValue, true); // true = little-endian

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function dbToBytes(dbValue) {
  // Convert dB to linear gain: 10^(dB/20)
  const linearGain = Math.pow(10, dbValue / 20);

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, linearGain, true); // true = little-endian

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

function msToBytes(msValue, sampleLengthMs = 460.59) {
  // Normalize by sample length
  const normalizedValue = msValue / sampleLengthMs;

  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, normalizedValue, true); // true = little-endian

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    bytes.push(view.getUint8(i));
  }
  return bytes;
}

const filePath = '/home/yura/Documents/REAPER Media/test1/test1.RPP';
// const filePath = '/home/yura/dev/MY/ep133-export-to-daw/.tmp/reaper/test2.RPP';
const txt = fs.readFileSync(filePath, 'utf8');

const lines = txt.split(/\r?\n/);
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('<VST')) {
    startIdx = i;
    break;
  }
}

const section = [];
for (let i = startIdx; i < lines.length; i++) {
  const t = lines[i].trim();
  if (i > startIdx && t === '>') break;
  section.push(lines[i]);
}

// const firstPart = section[1].trim();
// const secondPart =
//   section[2].trim() + section[3].trim() + section[4].trim() + section[5].trim() + section[6].trim();

// const firstPartDecoded = Buffer.from(firstPart, 'base64');
// const secondPartDecoded = Buffer.from(secondPart, 'base64');

const joined = section.slice(1).join('');
// const [firstPart, secondPart] = joined.split('=\n');

const sections = [];
let buf = '';
for (let i = 0; i < joined.length; i++) {
  buf += joined[i];

  if ((joined[i] === '=' && joined[i + 1] === ' ') || i === joined.length - 1) {
    sections.push(buf.trim().replace(/\s/g, ''));
    buf = '';
  }
}

// console.log(sections);

// console.log([firstPart, secondPart]);

// const str = Buffer.from(sections[1], 'base64').toString('utf8');
const bin1 = Buffer.from(sections[0], 'base64');
const bin2 = Buffer.from(sections[1], 'base64');

const idx = bin2.indexOf(0x00) + 1;
// console.log(idx);
const textData = bin2.slice(0, idx).toString('utf8');
const cut = bin2.slice(idx);
// console.dir(textData);
console.dir(Array.from(cut), { maxArrayLength: null, compact: false });
// console.log(cut.length);
// console.log(str.split('.wav')[1]);
// const str1 = str.split('.wav')[1];
// console.log(str1);
// let text = '';

// for (let i = 0; i < bin.length; i++) {
//   text +=
//     i.toString().padStart(3, '0') +
//     ': ' +
//     // String.fromCharCode(str1[i]) +
//     str1.charCodeAt(i) +
//     '\n';
// }
// const val = new Uint8Array(bin1);

const size = (bin1[33] << 8) + bin1[32];

// console.dir(new Uint8Array(bin1), { maxArrayLength: null, compact: false });

// console.log('Size:', size);
// console.log(int32ToLEBytes(size));

const newHeader = [...VST_HEADER];
newHeader.splice(32, 4, ...int32ToLEBytes(347));

// console.dir(newHeader, { maxArrayLength: null, compact: false });

// console.dir(new Uint8Array(bin2), { maxArrayLength: null, compact: false });
// console.log(bin2.length);
// console.dir(val.slice(207, 214), { maxArrayLength: null, compact: false });

// const ofs = 280;
// console.dir(val.slice(ofs, ofs + 8), { compact: false });
// console.dir(paramToBytes(18.11), { compact: false });

// console.log(bytesToFloat32BE([0x40, 0x94, 0x84, 0xf2]));
// console.dir(paramToBytes(10), { compact: false });
// console.dir(dbToBytes(-10), { compact: false });

console.log(bytesToDouble([252, 169, 241, 210, 77, 98, 64, 63]));
console.log(bytesToDouble([8, 4, 2, 129, 64, 32, 128, 63]));
console.log(bytesToDouble([252, 169, 241, 210, 77, 98, 48, 63]));
// console.log(doubleToBytes(460.59));
// console.log(int32ToLEBytes(46875));
