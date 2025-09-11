import JSZip from 'jszip';
import xml2js from 'xml2js';
import { DeviceService } from '../../../ep133/device-service';
import {
  ExporterParams,
  ExportResult,
  ExportStatus,
  ProjectRawData,
  ProjectSettings,
  SampleReport,
  Sound,
} from '../../../types/types';
import dawProjectTransformer, {
  DawClip,
  DawLane,
  DawScene,
  DawTrack,
} from '../../transformers/dawProject';
import { collectSamples } from '../utils';
import { ALSMidiClip, ALSMidiClipContent } from './templates/midiClip';
import { ALSMidiTrack, ALSMidiTrackContent } from './templates/midiTrack';
import { ALSMultiSamplerContent, ALSSampler } from './templates/sampler';
import { ALSOriginalSimplerContent, ALSSimpler } from './templates/simpler';
import { fixIds, getId, gzipString, koEnvRangeToSeconds, loadTemplate } from './utils';

async function buildMidiClip(
  koClip: DawClip,
  clipIdx: number,
  color: number,
  clipForLauncher: boolean = false,
): Promise<ALSMidiClipContent> {
  const midiClipTemplate = await loadTemplate<ALSMidiClip>('midiClip');
  const midiClip = structuredClone(midiClipTemplate.MidiClip);

  const time = koClip.offset * 4;
  const start = time;
  const end = time + koClip.sceneBars * 4;

  midiClip._attrs.Id = clipIdx;
  midiClip._attrs.Time = time;
  midiClip.CurrentStart._attrs.Value = start;
  midiClip.CurrentEnd._attrs.Value = end;
  midiClip.Loop.LoopOn._attrs.Value = 'true';
  midiClip.Loop.LoopStart._attrs.Value = 0;
  midiClip.Loop.LoopEnd._attrs.Value = koClip.bars * 4;
  midiClip.Loop.HiddenLoopStart._attrs.Value = 0;
  midiClip.Loop.HiddenLoopEnd._attrs.Value = koClip.bars * 4;
  midiClip.Color._attrs.Value = color;
  midiClip.Name._attrs.Value = `Scene ${koClip.sceneName}`;

  if (clipForLauncher) {
    midiClip._attrs.Time = 0;
    midiClip.CurrentStart._attrs.Value = 0;
    midiClip.CurrentEnd._attrs.Value = koClip.bars * 4;
  }

  // ableton group notes
  const grouppedNotes: Record<string, typeof koClip.notes> = koClip.notes.reduce(
    (acc, note) => {
      const group = note.note.toString();
      acc[group] = acc[group] || [];
      acc[group].push(note);

      return acc;
    },
    {} as Record<string, typeof koClip.notes>,
  );

  midiClip.Notes.KeyTracks.KeyTrack = [];
  let _noteId = 0;

  Object.entries(grouppedNotes).forEach(([note, notes], groupIndex) => {
    midiClip.Notes.KeyTracks.KeyTrack.push({
      _attrs: {
        Id: groupIndex,
      },
      Notes: {
        MidiNoteEvent: notes.map((note, noteIndex) => {
          let dur = note.duration / 96;
          const nextNote = notes[noteIndex + 1];

          // making sure same notes are not overlapping
          if (nextNote && note.position / 96 + dur > nextNote.position / 96) {
            dur = nextNote.position / 96 - note.position / 96;
          }

          return {
            _attrs: {
              Time: note.position / 96,
              Duration: dur,
              Velocity: note.velocity,
              OffVelocity: 64,
              NoteId: _noteId++,
            },
          };
        }),
      },
      MidiKey: {
        _attrs: {
          Value: note,
        },
      },
    });
  });

  return midiClip;
}

async function buildSamplerDevice(
  koTrack: DawTrack,
  exporterParams: ExporterParams,
): Promise<ALSMultiSamplerContent | ALSOriginalSimplerContent | null> {
  if (!koTrack.sampleName || !exporterParams.includeArchivedSamples) {
    return null;
  }

  const [samplerTemplate, simplerTemplate] = await Promise.all([
    loadTemplate<ALSSampler>('sampler'),
    loadTemplate<ALSSimpler>('simpler'),
  ]);

  let device: ALSMultiSamplerContent | ALSOriginalSimplerContent;

  if (exporterParams.useSampler) {
    device = structuredClone(samplerTemplate.MultiSampler);
  } else {
    device = structuredClone(simplerTemplate.OriginalSimpler);
  }

  device.LastPresetRef.Value = {};
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleRef.FileRef.RelativePath._attrs.Value = `Samples/Imported/${koTrack.sampleName}`;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.Name._attrs.Value = koTrack.name;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleStart._attrs.Value =
    koTrack.trimLeft;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleEnd._attrs.Value =
    koTrack.trimRight;
  device.VolumeAndPan.Envelope.ReleaseTime.Manual._attrs.Value =
    koEnvRangeToSeconds(koTrack.release, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Envelope.AttackTime.Manual._attrs.Value =
    koEnvRangeToSeconds(koTrack.attack, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Panorama.Manual._attrs.Value = koTrack.pan;
  device.Pitch.TransposeKey.Manual._attrs.Value = (koTrack.pitch || 0) + (60 - koTrack.rootNote); // root note of the sample should be taken into account

  return device;
}

async function buildTrack(
  koTrack: DawTrack,
  trackIdx: number,
  exporterParams: ExporterParams,
  lanes: DawLane[],
  maxScenes: number,
): Promise<ALSMidiTrackContent> {
  const midiTrackTemplate = await loadTemplate<ALSMidiTrack>('midiTrack');
  const midiTrack = structuredClone(midiTrackTemplate.MidiTrack);

  midiTrack._attrs.Id = trackIdx;
  midiTrack.Name.EffectiveName._attrs.Value = koTrack.soundId
    ? `${String(koTrack.soundId).padStart(3, '0')} ${koTrack.name}`
    : koTrack.name;
  midiTrack.Name.UserName._attrs.Value = midiTrack.Name.EffectiveName._attrs.Value;
  midiTrack.Color._attrs.Value = 8 + trackIdx; // started with 8th color in the Ableton palette, why not
  midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip = [];
  midiTrack.DeviceChain.Mixer.Volume.Manual._attrs.Value = koTrack.volume / 2;

  const samplerDevice = await buildSamplerDevice(koTrack, exporterParams);

  if (samplerDevice) {
    if (exporterParams.useSampler) {
      midiTrack.DeviceChain.DeviceChain.Devices = { MultiSampler: samplerDevice };
    } else {
      midiTrack.DeviceChain.DeviceChain.Devices = { OriginalSimpler: samplerDevice };
    }
  }

  // make sure each tracks has the same empty slots for clips
  if (exporterParams.clips) {
    for (let sc = 0; sc < maxScenes; sc++) {
      midiTrack.DeviceChain.MainSequencer.ClipSlotList.ClipSlot[sc] = {
        _attrs: {
          Id: sc,
        },
        LomId: {
          _attrs: {
            Value: 0,
          },
        },
        ClipSlot: {
          Value: {},
        },
      };
      midiTrack.DeviceChain.FreezeSequencer.ClipSlotList.ClipSlot[sc] = {
        _attrs: {
          Id: sc,
        },
        LomId: {
          _attrs: {
            Value: 0,
          },
        },
        ClipSlot: {
          Value: {},
        },
        HasStop: {
          _attrs: {
            Value: 'true',
          },
        },
        NeedRefreeze: {
          _attrs: {
            Value: 'true',
          },
        },
      };
    }
  }

  const koLane = lanes.find((l: DawLane) => l.padCode === koTrack.padCode);

  if (koLane) {
    if (!exporterParams.clips) {
      for (const [clipIdx, koClip] of koLane.clips.entries()) {
        const midiClip = await buildMidiClip(koClip, clipIdx, midiTrack.Color._attrs.Value);

        midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip.push(
          midiClip,
        );
      }
    } else {
      for (const koClip of koLane.clips.values()) {
        const midiClip = await buildMidiClip(koClip, 0, midiTrack.Color._attrs.Value, true);

        midiTrack.DeviceChain.MainSequencer.ClipSlotList.ClipSlot[koClip.sceneIndex] = {
          ...midiTrack.DeviceChain.MainSequencer.ClipSlotList.ClipSlot[koClip.sceneIndex],
          ClipSlot: {
            Value: {
              MidiClip: midiClip,
            },
          },
        };
      }
    }
  }

  return midiTrack;
}

async function buildScenes(scenes: DawScene[], settings: ProjectSettings) {
  const sceneTemplate = await loadTemplate<any>('scene');
  const result: any[] = [];

  scenes.forEach((scene, idx) => {
    const sceneContent = structuredClone(sceneTemplate.Scene);

    sceneContent._attrs.Id = idx;
    sceneContent.Name._attrs.Value = scene.name;
    sceneContent.Tempo._attrs.Value = settings.bpm;

    result.push(sceneContent);
  });

  return result;
}

async function buildProject(
  projectData: ProjectRawData,
  sounds: Sound[],
  exporterParams: ExporterParams,
) {
  const transformedData = dawProjectTransformer(projectData, sounds);

  if (import.meta.env.DEV) {
    console.log('sound', sounds);
    console.log('projectData', projectData);
    console.log('transformedData', transformedData);
  }

  const projectTemplate = await loadTemplate<any>('project');
  const project = structuredClone(projectTemplate);
  const maxScenes = transformedData.scenes.length;

  // setting up tempo
  project.Ableton.LiveSet.MasterTrack.DeviceChain.Mixer.Tempo.Manual._attrs.Value =
    projectData.settings.bpm;
  project.Ableton.LiveSet.MasterTrack.AutomationEnvelopes.Envelopes.AutomationEnvelope[1].Automation.Events.FloatEvent._attrs.Value =
    projectData.settings.bpm;

  project.Ableton.LiveSet.Tracks.MidiTrack = [];

  for (const [trackIdx, koTrack] of transformedData.tracks.entries()) {
    const midiTrack = await buildTrack(
      koTrack,
      trackIdx,
      exporterParams,
      transformedData.lanes,
      maxScenes,
    );
    project.Ableton.LiveSet.Tracks.MidiTrack.push(midiTrack);
  }

  if (exporterParams.clips) {
    project.Ableton.LiveSet.Scenes.Scene = await buildScenes(
      transformedData.scenes,
      projectData.settings,
    );
  }

  const builder = new xml2js.Builder({
    attrkey: '_attrs',
    charkey: '_text',
  });

  const fixedRoot = fixIds(project);
  fixedRoot.Ableton.LiveSet.NextPointeeId._attrs.Value = getId() + 1;

  if (import.meta.env.DEV) {
    console.log('ROOT', fixedRoot);
  }

  const newXml = builder.buildObject(fixedRoot);
  const gzipped = gzipString(newXml);

  return gzipped;
}

async function exportAbleton(
  projectId: string,
  data: ProjectRawData,
  sounds: Sound[],
  deviceService: DeviceService,
  progressCallback: ({ progress, status }: ExportStatus) => void,
  exporterParams: ExporterParams,
) {
  const files: Array<{
    name: string;
    url: string;
    type: 'project' | 'archive';
    size: number;
  }> = [];
  const projectName = `Project${projectId}`;
  const zippedProject = new JSZip();

  progressCallback({ progress: 1, status: 'Building project...' });

  const alsFile = await buildProject(data, sounds, exporterParams);

  zippedProject.file(`${projectName} Project/${projectName}.als`, alsFile);
  zippedProject.file(`${projectName} Project/Ableton Project Info/.dummy`, '');

  let sampleReport: SampleReport | undefined;

  if (exporterParams.includeArchivedSamples) {
    const { samples, sampleReport: report } = await collectSamples(
      data,
      sounds,
      deviceService,
      progressCallback,
    );
    samples.forEach((s) => {
      zippedProject.file(`Project${projectId} Project/Samples/Imported/${s.name}`, s.data);
    });
    sampleReport = report;
  }

  progressCallback({ progress: 90, status: 'Bundle everything...' });

  const zippedProjectFile = await zippedProject.generateAsync({ type: 'blob' });

  files.push({
    name: `${projectName}.zip`,
    url: URL.createObjectURL(zippedProjectFile),
    type: 'archive',
    size: zippedProjectFile.size,
  });

  progressCallback({ progress: 100, status: 'Done' });

  return {
    files,
    sampleReport,
  } as ExportResult;
}

export default exportAbleton;
