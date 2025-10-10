import fs from 'node:fs';

function decodeFixed32(bytes) {
  const dv = new DataView(Uint8Array.from(bytes).buffer);
  // Little-endian signed 32-bit integer
  const intVal = dv.getInt32(0, true);
  // return intVal / (1 << 28);
  return intVal / (1 << 28);
}

function bytesToFloat32BE(bytes) {
  const buffer = new ArrayBuffer(4);
  const dv = new DataView(buffer);
  bytes.forEach((b, i) => dv.setUint8(i, b));
  return dv.getFloat32(0, false); // false = big-endian
}

function encodeFixed32(value) {
  const buffer = new ArrayBuffer(4);
  const dv = new DataView(buffer);
  const intVal = Math.round(value * (1 << 28));
  dv.setInt32(0, intVal, true);
  return Array.from(new Uint8Array(buffer));
}

const filePath = '/home/yura/Documents/REAPER Media/test1/test1.RPP';
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

const firstPart = section[1].trim();
const secondPart =
  section[2].trim() + section[3].trim() + section[4].trim() + section[5].trim() + section[6].trim();

const firstPartDecoded = Buffer.from(firstPart, 'base64');
const secondPartDecoded = Buffer.from(secondPart, 'base64');

// console.log(secondPartDecoded.toString());

for (const str of [firstPartDecoded, secondPartDecoded]) {
  let text = '';

  for (let i = 0; i < str.length; i++) {
    text +=
      i.toString().padStart(3, '0') +
      ': ' +
      // String.fromCharCode(str[i]) +
      str[i].toString(10) +
      '\n';
  }

  console.log(text);
}

console.log(bytesToFloat32BE([0x40, 0x94, 0x84, 0xf2]));
console.log(
  bytesToFloat32BE([
    secondPartDecoded[81],
    secondPartDecoded[82],
    secondPartDecoded[83],
    secondPartDecoded[84],
  ]),
);
