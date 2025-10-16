import fs from 'node:fs';

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

function midiNoteToBytes(note) {
  return doubleToBytes((note - 40) / 160);
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

const joined = section.slice(1).join('');

const sections = [];
let buf = '';
for (let i = 0; i < joined.length; i++) {
  buf += joined[i];

  if ((joined[i] === '=' && joined[i + 1] === ' ') || i === joined.length - 1) {
    sections.push(buf.trim().replace(/\s/g, ''));
    buf = '';
  }
}

const bin1 = Buffer.from(sections[0], 'base64');
const bin2 = Buffer.from(sections[1], 'base64');

const idx = bin2.indexOf(0x00) + 1;
// console.log(idx);
// const textData = bin2.slice(0, idx).toString('utf8');
const cut2 = bin2.slice(idx);
// console.dir(textData);
// console.dir(Array.from(cut2), { maxArrayLength: null, compact: false });
// console.log(cut.length);
// console.log(bytesToString(cut2));

// console.log('Size:', size);
// console.log(int32ToLEBytes(size));

// const newHeader = [...VST_HEADER];
// newHeader.splice(32, 4, ...int32ToLEBytes(347));

// console.dir(newHeader, { maxArrayLength: null, compact: false });

// console.dir(new Uint8Array(bin2), { maxArrayLength: null, compact: false });
// console.log(bin2.length);
// console.dir(val.slice(207, 214), { maxArrayLength: null, compact: false });

const ofs = 40;
console.dir(cut2.slice(ofs, ofs + 8), { compact: false });
console.log(bytesToDouble(cut2.slice(ofs, ofs + 8)));
// console.dir(paramToBytes(18.11), { compact: false });

// console.log(bytesToFloat32BE([0x40, 0x94, 0x84, 0xf2]));
// console.dir(paramToBytes(10), { compact: false });
// console.dir(dbToBytes(-10), { compact: false });

// console.log(midiNoteToBytes(60));
// console.log(bytesToDouble(midiNoteToBytes(60)));
// console.log(doubleToBytes(460.59));
// console.log(int32ToLEBytes(46875));
