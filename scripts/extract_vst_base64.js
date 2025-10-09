#!/usr/bin/env node
import fs from 'fs';

// Simplified: hardcoded input file, always two base64 parts in first <VST section>
const filePath = '.tmp/reaper/test2.RPP';
let txt;
try {
  txt = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error('Error reading file:', err.message);
  process.exit(1);
}

const lines = txt.split(/\r?\n/);
let startIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim().startsWith('<VST')) {
    startIdx = i;
    break;
  }
}
if (startIdx === -1) {
  console.error('No <VST section found');
  process.exit(2);
}

const section = [];
for (let i = startIdx; i < lines.length; i++) {
  const t = lines[i].trim();
  if (i > startIdx && t === '>') break;
  section.push(lines[i]);
}

// Collect base64-like sequences (allow split across multiple lines)
const parts = [];
let cur = '';
for (const raw of section) {
  const s = raw.trim();
  if (s === '') continue;
  // if line is pure base64 chars, append to current
  if (/^[A-Za-z0-9+/=]+$/.test(s)) {
    cur += s;
    continue;
  }
  // otherwise extract any long base64 substrings
  const m = s.match(/[A-Za-z0-9+/=]{8,}/g);
  if (m) {
    if (cur) {
      parts.push(cur);
      cur = '';
    }
    for (const x of m) parts.push(x);
    continue;
  }
  // non-base64 line -> flush
  if (cur) {
    parts.push(cur);
    cur = '';
  }
}
if (cur) parts.push(cur);

// We expect exactly two parts; if more, take first two; if fewer, fail
if (parts.length < 2) {
  console.error('Found fewer than 2 base64 parts');
  process.exit(3);
}
const firstTwo = parts.slice(0, 2);

for (const p of firstTwo) {
  try {
    const buf = Buffer.from(p.replace(/\s+/g, ''), 'base64');
    process.stdout.write(buf);
  } catch (e) {
    console.error('Failed to decode part');
    process.exit(4);
  }
}
