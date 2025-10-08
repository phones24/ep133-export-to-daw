export type ReaperMidiEvent = {
  // absolute tick position within the take
  tick: number;
  // midi bytes for the event (e.g. [144, 60, 100])
  data: number[];
};

export type ReaperMidiItem = {
  position: number; // seconds position in project
  length: number; // seconds length
  takeName?: string;
  ppq?: number;
  events: ReaperMidiEvent[];
};

export type ReaperTrack = {
  name?: string;
  volume?: number; // 0.0-1.0
  pan?: number; // -1..1
  items?: ReaperMidiItem[];
  guid?: string;
};

export type ReaperProject = {
  projectName?: string;
  tempo: number;
  tracks: ReaperTrack[];
};

const obj = {
  projectName: 'My Project',
  tempo: 120,

  midiTracks: [
    {
      name: 'Track 1',
      items: [
        {
          name: 'MIDI Item 1',
        },
        {
          name: 'MIDI Item 2',
        },
      ],

      midiTracks: [
        {
          name: 'Subtrack 1',
        },
      ],
    },
  ],
};

export function generateReaperProject(input: ReaperProject): string {}

/*
// Helpers
function fmt(n: number, decimals = 6) {
  if (Number.isInteger(n)) return n.toString();
  return n
    .toFixed(decimals)
    .replace(/(?:\.([0-9]*?))0+$/, '.$1')
    .replace(/\.$/, '');
}

function quote(s = '') {
  return `"${s.replace(/"/g, '\\"')}"`;
}

function ensureGuid(g?: string) {
  if (g && g.length === 36) return g.toUpperCase();
  return crypto.randomUUID();
}

function indent(level: number) {
  return '  '.repeat(level);
}

// MIDI event formatter: REAPER uses lines like "E 0 3 144 60 100" where first number is delta ticks
function midiEventsToSourceLines(events: ReaperMidiEvent[]) {
  if (!events || events.length === 0) return [];
  // sort by tick
  const ev = [...events].sort((a, b) => a.tick - b.tick);
  let lastTick = 0;
  return ev.map((e) => {
    const delta = e.tick - lastTick;
    lastTick = e.tick;
    const bytes = e.data.join(' ');
    return `E ${delta} ${e.data.length} ${bytes}`;
  });
}

// Main generator
export function jsonToRppText(src: ReaperProject) {
  const ppq = src.ppq ?? 960;
  const tempo = src.tempo ?? 120;
  const sr = src.sampleRate ?? 44100;
  const playRate = src.playRate ?? 1.0;

  const lines: string[] = [];
  lines.push('<REAPER_PROJECT 0.1 "7.48/" "x64">');
  lines.push(`  <PROJECT ${quote(src.projectName ?? 'Untitled')}>`);
  lines.push(`${indent(2)}<PROJECT_NAME ${quote(src.projectName ?? 'Untitled')}>`);
  lines.push(`${indent(2)}TEMPO ${fmt(tempo)}`);
  lines.push(`${indent(2)}PLAYRATE ${fmt(playRate)}`);
  lines.push(`${indent(2)}SAMPLERATE ${fmt(sr)}`);
  lines.push(`${indent(2)}PPQ ${ppq}`);
  lines.push(`${indent(2)}EXT ""`);

  // Tracks
  const tracks = src.tracks ?? [];
  tracks.forEach((t, ti) => {
    const tguid = ensureGuid(t.guid);
    lines.push(`${indent(2)}<TRACK ${quote(tguid)}>`);
    lines.push(`${indent(3)}NAME ${quote(t.name ?? `Track ${ti + 1}`)}`);
    if (typeof t.volume === 'number') {
      // REAPER uses volume as dB string like "1.000000" in VOLPAN — we keep linear
      lines.push(`${indent(3)}VOLPAN ${fmt(t.volume)} ${fmt(t.pan ?? 0)}`);
    } else {
      lines.push(`${indent(3)}VOLPAN 1.0 0.0`);
    }

    // Items
    const items = t.items ?? [];
    items.forEach((it) => {
      lines.push(`${indent(3)}<ITEM ${quote(ensureGuid())}>`);
      lines.push(`${indent(4)}POSITION ${fmt(it.position)}`);
      lines.push(`${indent(4)}LENGTH ${fmt(it.length)}`);
      lines.push(`${indent(4)}LOOP 0`);
      lines.push(`${indent(4)}ALLTAKES 0`);
      // TAKE
      const takeGuid = ensureGuid();
      const takePPQ = it.ppq ?? ppq;
      lines.push(`${indent(4)}<SOURCE MIDI ${quote(takeGuid)}>`);
      lines.push(`${indent(5)}HASDATA 1 ${takePPQ} QN`);
      lines.push(`${indent(5)}TICKS_PER_BEAT ${takePPQ}`);
      lines.push(`${indent(5)}SAMPLE_RATE ${sr}`);
      lines.push(`${indent(5)}CHANNELS 1`);
      // inline MIDI events
      const evLines = midiEventsToSourceLines(it.events ?? []);
      evLines.forEach((l) => lines.push(`${indent(5)}${l}`));
      lines.push(`${indent(4)}</SOURCE>`); // close SOURCE

      lines.push(`${indent(3)}</ITEM>`);
    });

    lines.push(`${indent(2)}</TRACK>`);
  });

  lines.push(`${indent(2)}<MASTER_TRACK 0>`);
  lines.push(`${indent(2)}</MASTER_TRACK>`);

  lines.push('</REAPER_PROJECT>');

  return lines.join('\n') + '\n';
}
*/
