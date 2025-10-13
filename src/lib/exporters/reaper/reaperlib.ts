import { TimeSignature } from '../../../types/types';
import { getNextColor, getQuarterNotesPerBar, UNITS_PER_BEAT, unitsToTicks } from '../utils';

export type ReaperMidiEvent = {
  note: number;
  position: number;
  length: number;
  velocity: number;
};

export type ReaperMidiItem = {
  position: number;
  length: number;
  lengthInBars: number;
  name?: string;
  events: ReaperMidiEvent[];
};

export type ReaperSample = {
  name: string;
  rate: number;
  channels: number;
  length: number;
  timeStretch: string;
  timeStretchBars: number;
  timeStretchBpm: number;
  trimLeft: number;
  trimRight: number;
  rootNote: number;
  attack: number;
  release: number;
  playMode: string;
  pitch: number;
};

export type ReaperTrack = {
  name: string;
  guid: string;
  tempo: number;
  volume: number;
  pan: number;
  sample: ReaperSample | null;
  timeSignature: TimeSignature;
  tracks?: ReaperTrack[];
  items?: ReaperMidiItem[];
};

export type ReaperProject = {
  projectName?: string;
  tempo: number;
  timeSignature: TimeSignature;
  tracks?: ReaperTrack[];
};

type ReaperFileElem = {
  name: string;
  attrs?: (string | number)[];
  content?: (ReaperFileElem | (string | number)[])[];
};

const PPQ = 960; // default reaper midi ppq

function hexToReaperColor(hexColor: string, alpha = 0xff) {
  hexColor = hexColor.replace('#', '');

  const red = parseInt(hexColor.substring(0, 2), 16);
  const green = parseInt(hexColor.substring(2, 4), 16);
  const blue = parseInt(hexColor.substring(4, 6), 16);

  return (alpha << 24) | (blue << 16) | (green << 8) | red;
}

function renderLine(name: string, attrs: (string | number)[] = []) {
  return `${name} ${attrs
    .map((block) => {
      if (typeof block === 'string' && block.match(/\w+-\w+-\w+-\w+-\w+/)) {
        return `{${block}}`;
      }

      return typeof block === 'string' ? `"${block}"` : block;
    })
    .join(' ')}`;
}

/*
function addFxChain(root: ReaperFileElem['content'], rprTrack: ReaperTrack) {
  root?.push({
    name: 'FXCHAIN',
    content: [
      ['WNDRECT', 32, 117, 1037, 681],
      ['SHOW', 0],
      ['LASTSEL', 0],
      ['DOCKED', 0],
      ['BYPASS', 0, 0, 0],
      {
        name: 'VST',
        attrs: [
          'VSTi: ReaSamplOmatic5000 (Cockos)',
          'reasamplomatic.vst.so',
          0,
          '',
          '1920167789<56535472736F6D72656173616D706C6F>',
          '',
        ],
        content: [],
      },
    ],
  });
}
*/

function addTrackItem(
  root: ReaperFileElem['content'],
  rprItem: ReaperMidiItem,
  rprTrack: ReaperTrack,
  iid: number,
) {
  if (rprItem.events.length === 0) {
    return iid;
  }

  let offset = 0;
  let totalTicks = 0;
  const barLength = getQuarterNotesPerBar(
    rprTrack.timeSignature.numerator,
    rprTrack.timeSignature.denominator,
  );

  const clipLengthInUnits = rprItem.lengthInBars * barLength * UNITS_PER_BEAT;

  const events = rprItem.events
    .flat()
    .filter((evt) => evt.position < clipLengthInUnits)
    .reduce(
      (acc, evt, index) => {
        const nextEvent = rprItem.events[index + 1];
        let noteLength = evt.length;

        if (
          nextEvent &&
          nextEvent.note === evt.note &&
          nextEvent.position < evt.position + evt.length
        ) {
          // prevent notes overlapping
          noteLength = nextEvent.position - evt.position;
        }

        // prevent notes going beyond the item length
        if (evt.position + noteLength > clipLengthInUnits) {
          noteLength = evt.position + noteLength - clipLengthInUnits;
        }

        const noteOn = [
          'e',
          unitsToTicks(evt.position - offset, PPQ),
          '90',
          evt.note.toString(16),
          evt.velocity.toString(16),
        ];
        const noteOff = ['e', unitsToTicks(noteLength, PPQ), '80', evt.note.toString(16), '00'];

        offset = evt.position + noteLength;
        totalTicks += (noteOn[1] as number) + (noteOff[1] as number);

        return acc.concat([noteOn, noteOff]);
      },
      [] as (string | number)[][],
    );

  const barInTicks = PPQ * barLength;

  events.push(['E', Math.max(barInTicks * rprItem.lengthInBars - totalTicks, 0), 'b0', '7b', '00']);

  const item = {
    name: 'ITEM',
    content: [
      ['POSITION', rprItem.position],
      ['SNAPOFFS', 0],
      ['LENGTH', rprItem.length],
      ['LOOP', 1],
      ['ALLTAKES', 0],
      ['FADEIN', 1, 0, 0, 1, 0, 0, 0],
      ['FADEOUT', 1, 0, 0, 1, 0, 0, 0],
      ['MUTE', 0, 0],
      ['SEL', 0],
      ['IGUID', crypto.randomUUID().toUpperCase()],
      ['IID', iid++],
      ['NAME', rprItem.name || `MIDI Item ${iid}`],
      ['VOLPAN', 1, 0, 1, -1],
      ['SOFFS', 0],
      ['PLAYRATE', 1, 1, 0, -1, 0, 0.0025],
      ['CHANMODE', 0],
      ['GUID', crypto.randomUUID().toUpperCase()],
      {
        name: 'SOURCE',
        attrs: ['MIDI'],
        content: [
          ['HASDATA', 1, PPQ, 'QN'],
          ['CCINTERP', 32],
          ['POOLEDEVTS', crypto.randomUUID().toUpperCase()],
          ...events,
          ['CCINTERP', 32],
          ['CHASE_CC_TAKEOFFS', 1],
          ['GUID', crypto.randomUUID().toUpperCase()],
          ['IGNTEMPO', 0, rprTrack.tempo, 4, 4],
          ['SRCCOLOR', 6],
          ['EVTFILTER', 0, -1, -1, -1, -1, 0, 0, 0, 0, -1, -1, -1, -1, 0, -1, 0, -1, -1],
          ['VELLANE', -1, 100, 0, 0, 1],
          ['CFGEDITVIEW', 0, 0.226823, 65, 12, 0, 0, 0, 0, 0, 0.5],
          ['KEYSNAP', 0],
          ['TRACKSEL', 0],
          [
            'CFGEDIT',
            1,
            1,
            0,
            1,
            0,
            0,
            1,
            1,
            1,
            1,
            1,
            0.125,
            753,
            516,
            1975,
            1078,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0.5,
            0,
            0,
            1,
            64,
          ],
        ],
      },
    ],
  };

  root?.push(item);

  return iid;
}

const addTrack = (
  root: ReaperFileElem['content'],
  rprTrack: ReaperTrack,
  iid: number,
  endOfGroup = false,
) => {
  let isBus = [0, 0];

  if (rprTrack.tracks?.length) {
    isBus = [1, 1];
  }

  if (endOfGroup) {
    isBus = [2, -1];
  }

  const newTrack: ReaperFileElem = {
    name: 'TRACK',
    attrs: [rprTrack.guid],
    content: [
      ['NAME', rprTrack.name || 'Track'],
      ['PEAKCOL', hexToReaperColor(getNextColor())],
      ['BEAT', -1],
      ['AUTOMODE', 0],
      ['PANLAWFLAGS', 3],
      ['VOLPAN', rprTrack.volume, rprTrack.pan, -1, -1, 1],
      ['MUTESOLO', 0, 0, 0],
      ['IPHASE', 0],
      ['PLAYOFFS', 0, 1],
      ['ISBUS', ...isBus],
      ['BUSCOMP', 0, 0, 0, 0, 0],
      ['SHOWINMIX', 1, 0.6667, 0.5, 1, 0.5, 0, 0, 0, 0],
      ['FIXEDLANES', 9, 0, 0, 0, 0],
      ['SEL', 0],
      ['REC', 0, 0, 1, 0, 0, 0, 0, 0],
      ['VU', 64],
      ['TRACKHEIGHT', 0, 0, 0, 0, 0, 0, 0],
      ['INQ', 0, 0, 0, 0.5, 100, 0, 0, 100],
      ['NCHAN', 2],
      ['FX', 1],
      ['TRACKID', rprTrack.guid],
      ['PERF', 0],
      ['MIDIOUT', -1],
      ['MAINSEND', 1, 0],
    ],
  };

  // commented out until I figured how ReaSamplOmatic5000 is storing its state
  // addFxChain(newTrack.content, rprTrack);

  if (rprTrack.items) {
    rprTrack.items.forEach((rprItem) => {
      iid = addTrackItem(newTrack.content, rprItem, rprTrack, iid);
    });
  }

  root?.push(newTrack);

  rprTrack.tracks?.forEach((_track, idx) => {
    iid = addTrack(root, _track, iid, idx === rprTrack.tracks!.length - 1);
  });

  return iid;
};

function createReaperProject({ tempo = 120, timeSignature, tracks = [] }: ReaperProject) {
  let _iid = 1;

  const _root: ReaperFileElem[] = [
    {
      name: 'REAPER_PROJECT',
      attrs: ['0.1', '7.48/unknown-x86_64', Math.round(Date.now() / 1000)],
      content: [
        {
          name: 'NOTES',
          attrs: [0, 2],
        },
        ['RIPPLE', 0, 0],
        ['GROUPOVERRIDE', 0, 0, 0, 0],
        ['AUTOXFADE', 129],
        ['ENVATTACH', 3],
        ['POOLEDENVATTACH', 0],
        ['MIXERUIFLAGS', 11, 48],
        ['ENVFADESZ10', 40],
        ['PEAKGAIN', 1],
        ['FEEDBACK', 0],
        ['PANLAW', 1],
        ['PROJOFFS', 0, 0, 0],
        ['MAXPROJLEN', 0, 0],
        ['GRID', 3199, 8, 1, 8, 1, 0, 0, 0],
        ['TIMEMODE', 1, 5, -1, 30, 0, 0, -1],
        ['VIDEO_CONFIG', 0, 0, 65792],
        ['PANMODE', 3],
        ['PANLAWFLAGS', 3],
        ['CURSOR', 0],
        ['ZOOM', 100, 0, 0],
        ['VZOOMEX', 6, 0],
        ['USE_REC_CFG', 0],
        ['RECMODE', 1],
        ['SMPTESYNC', 0, 30, 100, 40, 1000, 300, 0, 0, 1, 0, 0],
        ['LOOP', 1],
        ['LOOPGRAN', 0],
        ['RECORD_PATH', 'Media', ''],
        {
          name: 'RECORD_CFG',
          content: [['ZXZhdxgAAQ==']],
        },
        {
          name: 'APPLYFX_CFG',
        },
        ['RENDER_FILE', ''],
        ['RENDER_PATTERN', ''],
        ['RENDER_FMT', 0, 2, 0],
        ['RENDER_1X', 0],
        ['RENDER_RANGE', 1, 0, 0, 0, 1000],
        ['RENDER_RESAMPLE', 3, 0, 1],
        ['RENDER_ADDTOPROJ', 0],
        ['RENDER_STEMS', 0],
        ['RENDER_DITHER', 0],
        ['TIMELOCKMODE', 1],
        ['TEMPOENVLOCKMODE', 1],
        ['ITEMMIX', 1],
        ['DEFPITCHMODE', 589824, 0],
        ['TAKELANE', 1],
        ['SAMPLERATE', 44100, 0, 0],
        {
          name: 'RENDER_CFG',
          content: [['ZXZhdxgAAQ==']],
        },
        ['LOCK', 1],
        {
          name: 'METRONOME',
          attrs: [6, 2],
          content: [
            ['VOL', 0.25, 0.125],
            ['BEATLEN', 4],
            ['FREQ', 1760, 880, 1],
            ['SAMPLES', '', '', '', ''],
            ['SPLIGNORE', 0, 0],
            ['SPLDEF', 2, 660, '', 0, ''],
            ['SPLDEF', 3, 440, '', 0, ''],
            ['PATTERN', 0, 169],
            ['PATTERNSTR', 'ABBB'],
            ['MULT', 1],
          ],
        },
        ['GLOBAL_AUTO', -1],
        ['TEMPO', tempo, timeSignature.numerator, timeSignature.denominator, 0],
        ['PLAYRATE', 1, 0, 0.25, 4],
        ['SELECTION', 0, 0],
        ['SELECTION2', 0, 0],
        ['MASTERAUTOMODE', 0],
        ['MASTERTRACKHEIGHT', 0, 0],
        ['MASTERPEAKCOL', 16576],
        ['MASTERMUTESOLO', 0],
        ['MASTERTRACKVIEW', 0, 0.6667, 0.5, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        ['MASTERHWOUT', 0, 0, 1, 0, 0, 0, 0, -1],
        ['MASTER_NCH', 2, 2],
        ['MASTER_VOLUME', 1, 0, -1, -1, 1],
        ['MASTER_PANMODE', 3],
        ['MASTER_PANLAWFLAGS', 3],
        ['MASTER_FX', 1],
        ['MASTER_SEL', 0],
        {
          name: 'MASTERPLAYSPEEDENV',
          content: [
            ['EGUID', crypto.randomUUID().toUpperCase()],
            ['ACT', 0, -1],
            ['VIS', 0, 1, 1],
            ['LANEHEIGHT', 0, 0],
            ['ARM', 0],
            ['DEFSHAPE', 0, -1, -1],
          ],
        },
        {
          name: 'TEMPOENVEX',
          content: [
            ['EGUID', crypto.randomUUID().toUpperCase()],
            ['ACT', 1, -1],
            ['VIS', 1, 0, 1],
            ['LANEHEIGHT', 0, 0],
            ['ARM', 0],
            ['DEFSHAPE', 1, -1, -1],
          ],
        },
        {
          name: 'PROJBAY',
          content: [],
        },
      ],
    },
  ];

  tracks.forEach((_track) => {
    _iid = addTrack(_root[0].content, _track, _iid);
  });

  return {
    toString(rootElems: any[] = _root, offset = 0) {
      let result = '';

      for (const elem of rootElems) {
        if (Array.isArray(elem)) {
          // biome-ignore lint/style/useTemplate: to messy
          result += `${' '.repeat(2 * offset)}` + renderLine(elem[0], elem.slice(1)) + '\n';
          continue;
        }

        // biome-ignore lint/style/useTemplate: to messy
        result += `${' '.repeat(2 * offset)}<` + renderLine(elem.name, elem.attrs) + '\n';

        if (elem.content && elem.content.length > 0) {
          result += this.toString(elem.content, offset + 1);
        }

        result += `${' '.repeat(2 * offset)}>\n`;
      }

      return result;
    },
  };
}

export function generateReaperProject(input: ReaperProject): string {
  const reaperProject = createReaperProject(input);

  return reaperProject.toString();
}
