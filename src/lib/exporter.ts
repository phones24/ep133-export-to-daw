import { toXML } from 'jstoxml';
import JSZip from 'jszip';
import { Sound } from '../hooks/useAllSounds';
import { ProjectRawData } from '../hooks/useProject';
import dawProjectTransformer, { DawClip, DawLane, DawTrack } from './dawProjectTransformer';
import { Note } from './parsers';

const xmlConfig = {
  indent: '    ',
  header: true,
};

const colors = [
  '#E27D60',
  '#85C1A9',
  '#E8A87C',
  '#C38D9E',
  '#41B3A3',
  '#F2B880',
  '#7DAF9C',
  '#F47261',
  '#9D6A89',
  '#5AA9A4',
  '#7A2A80',
  '#8FB996',
  '#47B267',
  '#B089A3',
  '#6CA6A3',
  '#B2B0E8',
  '#A0C4B0',
  '#F5A97F',
  '#BBA0C0',
  '#79B2B2',
];
let _id = 0;
let _colorIndex = 0;

function getNextColor() {
  const color = colors[_colorIndex];
  _colorIndex = (_colorIndex + 1) % colors.length;
  return color;
}

function genId() {
  return `id${_id++}`;
}

function buildMasterTrack() {
  return {
    _name: 'Track',
    _attrs: {
      name: 'Master',
      id: '__MASTER__',
      loaded: 'true',
      contentType: 'audio notes',
    },
    _content: {
      _name: 'Channel',
      _attrs: {
        role: 'master',
        solo: 'false',
        id: genId(),
        audioChannels: '2',
      },
      _content: [
        {
          _name: 'Mute',
          _attrs: {
            name: 'Mute',
            value: 'false',
            id: genId(),
          },
        },
        {
          _name: 'Pan',
          _attrs: {
            name: 'Pan',
            id: genId(),
            max: '1.000000',
            min: '0.000000',
            unit: 'normalized',
            value: '0.500000',
          },
        },
        {
          _name: 'Volume',
          _attrs: {
            name: 'Volume',
            id: genId(),
            max: '2.000000',
            min: '0.000000',
            unit: 'linear',
            value: '1.000000',
          },
        },
      ],
    },
  };
}

function buildTrack(track: DawTrack) {
  return {
    _name: 'Track',
    _attrs: {
      name: track.name,
      id: `__TRACK_${track.pad}__`,
      loaded: 'true',
      contentType: 'notes',
      color: getNextColor(),
    },
    _content: {
      _name: 'Channel',
      _attrs: {
        audioChannels: '2',
        destination: '__MASTER__',
        role: 'regular',
        solo: 'false',
        id: genId(),
      },
      _content: [
        {
          _name: 'Mute',
          _attrs: {
            name: 'Mute',
            value: 'false',
            id: genId(),
          },
        },
        {
          _name: 'Pan',
          _attrs: {
            name: 'Pan',
            id: genId(),
            max: '1.000000',
            min: '0.000000',
            unit: 'normalized',
            value: '0.500000',
          },
        },
        {
          _name: 'Volume',
          _attrs: {
            name: 'Volume',
            id: genId(),
            max: '2.000000',
            min: '0.000000',
            unit: 'linear',
            value: `${track.volume}`,
          },
        },
      ],
    },
  };
}

function buildStructure(tracks: DawTrack[]) {
  return {
    _name: 'Structure',
    _content: [buildMasterTrack(), ...tracks.map((t) => buildTrack(t))],
  };
}

function buildNote(note: Note) {
  return {
    _name: 'Note',
    _attrs: {
      time: note.position / 96,
      duration: note.duration / 96,
      channel: 0,
      key: note.note,
      vel: note.velocity / 100,
      rel: note.velocity / 100,
    },
  };
}

function buildClip(clip: DawClip) {
  return {
    _name: 'Clip',
    _attrs: {
      time: clip.offset * 4,
      duration: clip.bars * 4,
      playStart: 0,
      enable: 'true',
    },
    _content: {
      _name: 'Notes',
      _attrs: {
        id: genId(),
      },
      _content: clip.notes.map((note) => buildNote(note)),
    },
  };
}

function buildLane(lane: DawLane) {
  return {
    _name: 'Lanes',
    _attrs: {
      id: genId(),
      track: `__TRACK_${lane.pad}__`,
    },
    _content: {
      _name: 'Clips',
      _attrs: {
        id: genId(),
      },
      _content: lane.clips.map((clip) => buildClip(clip)),
    },
  };
}

function buildLanes(lanes: DawLane[]) {
  return {
    _name: 'Arrangement',
    _attrs: {
      id: genId(),
    },
    _content: {
      _name: 'Lanes',
      _attrs: {
        id: genId(),
        timeUnit: 'beats',
      },
      _content: lanes.map((lane) => buildLane(lane)),
    },
  };
}

export function buildMetadataXml() {
  const xml = toXML(
    {
      MetaData: {
        Title: '',
        Artist: '',
        Album: '',
        OriginalArtist: '',
        Songwriter: '',
        Producer: '',
        Year: '',
        Genre: '',
        Copyright: '',
        Comment: 'Made with EP-133 K.O. II: Export To DAW',
      },
    },
    xmlConfig,
  );
  return new Blob([xml], { type: 'text/xml' });
}

export async function buildProjectXml(projectData: ProjectRawData, sounds: Sound[]) {
  const transformedData = dawProjectTransformer(projectData, sounds);

  console.log(transformedData);

  _id = 0;

  const application = {
    _name: 'Application',
    _attrs: {
      name: 'Bitwig Studio',
    },
  };

  const transport = {
    _name: 'Transport',
    _content: [
      {
        _name: 'Tempo',
        _attrs: {
          unit: 'bpm',
          value: '120',
          name: 'Tempo',
          id: genId(),
        },
      },
      {
        _name: 'TimeSignature',
        _attrs: {
          numerator: '4',
          denominator: '4',
        },
      },
    ],
  };

  const main = toXML(
    {
      _name: 'Project',
      _attrs: {
        version: '1.0',
      },
      _content: [
        application,
        transport,
        buildStructure(transformedData.tracks),
        buildLanes(transformedData.lanes),
      ],
    },
    xmlConfig,
  );

  return new Blob([main], { type: 'text/xml' });
}

export async function exportDawProject(data: ProjectRawData, sounds: Sound[]) {
  const metadataXml = await buildMetadataXml();
  const projectXml = await buildProjectXml(data, sounds);

  console.log(await metadataXml.text());
  console.log(await projectXml.text());

  const zip = new JSZip();

  zip.file('metadata.xml', metadataXml);
  zip.file('project.xml', projectXml);

  const res = await zip.generateAsync({ type: 'blob' });

  return res;
}
