import { toXML } from 'jstoxml';
import JSZip from 'jszip';
import {
  ExporterParams,
  ExportResult,
  ExportStatus,
  Note,
  ProjectRawData,
  SampleReport,
} from '../../types/types';
import dawProjectTransformer, {
  DawClip,
  DawClipSlot,
  DawLane,
  DawScene,
  DawTrack,
} from '../transformers/dawProject';
import { AbortError } from '../utils';
import { collectSamples, getNextColor, getQuarterNotesPerBar } from './utils';

const PROJECT_NAME = 'EP-133 K.O. II: Export To DAW';

const XML_CONFIG = {
  indent: '    ',
  header: true,
};

let _id = 0;

function genId() {
  return `id${_id++}`;
}

function buildMasterTrack() {
  return {
    _name: 'Track',
    _attrs: {
      name: 'Master',
      id: genId(),
      loaded: 'true',
      contentType: 'audio notes',
    },
    _content: {
      _name: 'Channel',
      _attrs: {
        id: '__MASTER__',
        role: 'master',
        solo: 'false',
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
      name: track.soundId ? `${String(track.soundId).padStart(3, '0')} ${track.name}` : track.name,
      id: `__TRACK_${track.padCode}__`,
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
          _name: 'Devices',
          _content: {
            _name: 'BuiltinDevice',
            _attrs: {
              deviceName: 'Sampler',
              deviceRole: 'instrument',
              loaded: 'true',
              id: genId(),
              name: track.name,
            },
            _content: [
              {
                _name: 'Parameters',
                _attrs: {},
              },
              {
                _name: 'Enabled',
                _attrs: {
                  value: 'true',
                  id: genId(),
                  name: 'On/Off',
                },
              },
            ],
          },
        },
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

function buildNote(note: Note, index: number, notes: Note[]) {
  let dur = note.duration / 96;
  const nextNote = notes[index + 1];

  // making sure same notes are not overlapping
  if (nextNote && nextNote.note === note.note && dur > nextNote.position / 96) {
    dur = nextNote.position / 96 - note.position / 96;
  }

  return {
    _name: 'Note',
    _attrs: {
      time: note.position / 96,
      duration: dur,
      channel: 0,
      key: note.note,
      vel: note.velocity / 127,
    },
  };
}

function buildClip(clip: DawClip) {
  const barLength = getQuarterNotesPerBar(
    clip.sceneTimeSignature.numerator,
    clip.sceneTimeSignature.denominator,
  );

  return {
    _name: 'Clip',
    _attrs: {
      time: clip.offset * barLength,
      duration: clip.sceneBars * barLength,
      playStart: 0,
      loopStart: 0,
      loopEnd: clip.bars * barLength,
      enable: 'true',
    },
    _content: {
      _name: 'Notes',
      _attrs: {
        id: genId(),
      },
      _content: clip.notes.map(buildNote),
    },
  };
}

function buildLane(lane: DawLane) {
  return {
    _name: 'Lanes',
    _attrs: {
      id: genId(),
      track: `__TRACK_${lane.padCode}__`,
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

function buildArrangement(lanes: DawLane[]) {
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

function buildSceneClip(clip: DawClip) {
  const beatsInBar = clip.sceneTimeSignature.numerator;

  return {
    _name: 'Clip',
    _attrs: {
      time: clip.offset * beatsInBar,
      duration: clip.bars * beatsInBar,
      playStart: 0,
      loopStart: 0,
      loopEnd: clip.bars * beatsInBar,
      enable: 'true',
    },
    _content: {
      _name: 'Notes',
      _attrs: {
        id: genId(),
      },
      _content: clip.notes.map(buildNote),
    },
  };
}

function buildClipSlot(clipSlot: DawClipSlot) {
  return {
    _name: 'ClipSlot',
    _attrs: {
      track: `__TRACK_${clipSlot.track.padCode}__`,
      id: genId(),
      hasStop: 'true',
    },
    _content: clipSlot.clip.map((clip) => buildSceneClip(clip)),
  };
}

function buildScene(scene: DawScene) {
  return {
    _name: 'Scene',
    _attrs: {
      name: `Scene ${scene.name}`,
      id: `__SCENE_${scene.name}__`,
    },
    _content: {
      _name: 'Lanes',
      _content: scene.clipSlot.map((clipSlot) => buildClipSlot(clipSlot)),
    },
  };
}

function buildScenes(scenes: DawScene[]) {
  return {
    _name: 'Scenes',
    _content: scenes.map((scene) => buildScene(scene)),
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
        Comment: `Made with ${PROJECT_NAME}`,
      },
    },
    XML_CONFIG,
  );

  return new Blob([xml], { type: 'text/xml' });
}

export async function buildProjectXml(projectData: ProjectRawData, exporterParams: ExporterParams) {
  const transformedData = dawProjectTransformer(projectData, exporterParams);
  const { timeSignature } = projectData.scenesSettings;

  if (import.meta.env.DEV) {
    console.log('projectData', projectData);
    console.log('transformedData', transformedData);
  }

  _id = 0;

  const application = {
    _name: 'Application',
    _attrs: {
      name: PROJECT_NAME,
      version: '1.0',
    },
  };

  const transport = {
    _name: 'Transport',
    _content: [
      {
        _name: 'Tempo',
        _attrs: {
          unit: 'bpm',
          value: `${projectData.settings.bpm}`,
          name: 'Tempo',
          id: genId(),
        },
      },
      {
        _name: 'TimeSignature',
        _attrs: {
          numerator: timeSignature.numerator,
          denominator: timeSignature.denominator,
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
        buildArrangement(transformedData.lanes),
        exporterParams.clips ? buildScenes(transformedData.scenes) : false,
      ].filter(Boolean),
    },
    XML_CONFIG,
  );

  return new Blob([main], { type: 'text/xml' });
}

async function exportDawProject(
  projectId: string,
  data: ProjectRawData,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
  abortSignal: AbortSignal,
) {
  progressCallback({ progress: 1, status: 'Exporting project data...' });

  if (abortSignal.aborted) {
    throw new AbortError();
  }

  const metadataXml = buildMetadataXml();
  const projectXml = await buildProjectXml(data, exporterParams);

  progressCallback({ progress: 2, status: 'Creating project file...' });

  const zipProject = new JSZip();

  zipProject.file('metadata.xml', metadataXml);
  zipProject.file('project.xml', projectXml);

  const projectFile = await zipProject.generateAsync({ type: 'blob' });

  const files: Array<{
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }> = [
    {
      name: `project${projectId}.dawproject`,
      url: URL.createObjectURL(projectFile),
      type: 'project',
      size: projectFile.size,
    },
  ];

  let sampleReport: SampleReport | undefined;

  if (exporterParams.includeArchivedSamples) {
    const zipSamples = new JSZip();
    const { samples, sampleReport: report } = await collectSamples(
      data,
      progressCallback,
      abortSignal,
    );

    samples.forEach((s) => {
      zipSamples.file(s.name, s.data);
    });

    progressCallback({ progress: 90, status: 'Bundle samples...' });

    const sampleFile = await zipSamples.generateAsync({ type: 'blob' });

    files.push({
      name: `project${projectId}_samples.zip`,
      url: URL.createObjectURL(sampleFile),
      type: 'archive',
      size: sampleFile.size,
    });

    sampleReport = report;
  }

  progressCallback({ progress: 100, status: 'Done' });

  return {
    files,
    sampleReport,
  } as ExportResult;
}

export default exportDawProject;
