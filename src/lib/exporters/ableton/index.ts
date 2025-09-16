import JSZip from 'jszip';
import { create } from 'xmlbuilder2';
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
import { ALSGroupTrack } from './templates/groupTrack';
import { ALSMidiClip, ALSMidiClipContent } from './templates/midiClip';
import { ALSMidiTrack } from './templates/midiTrack';
import { ALSProject } from './templates/project';
import { ALSMultiSamplerContent, ALSSampler } from './templates/sampler';
import { ALSScene } from './templates/scene';
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

  midiClip['@Id'] = clipIdx;
  midiClip['@Time'] = time;
  midiClip.CurrentStart['@Value'] = start;
  midiClip.CurrentEnd['@Value'] = end;
  midiClip.Loop.LoopOn['@Value'] = 'true';
  midiClip.Loop.LoopStart['@Value'] = 0;
  midiClip.Loop.LoopEnd['@Value'] = koClip.bars * 4;
  midiClip.Loop.HiddenLoopStart['@Value'] = 0;
  midiClip.Loop.HiddenLoopEnd['@Value'] = koClip.bars * 4;
  midiClip.Color['@Value'] = color;
  midiClip.Name['@Value'] = `Scene ${koClip.sceneName}`;

  if (clipForLauncher) {
    midiClip['@Time'] = 0;
    midiClip.CurrentStart['@Value'] = 0;
    midiClip.CurrentEnd['@Value'] = koClip.bars * 4;
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
      '@Id': groupIndex,
      Notes: {
        MidiNoteEvent: notes.map((note, noteIndex) => {
          let dur = note.duration / 96;
          const nextNote = notes[noteIndex + 1];

          // making sure same notes are not overlapping
          if (nextNote && note.position / 96 + dur > nextNote.position / 96) {
            dur = nextNote.position / 96 - note.position / 96;
          }

          return {
            '@Time': note.position / 96,
            '@Duration': dur,
            '@Velocity': note.velocity,
            '@OffVelocity': 64,
            '@NoteId': _noteId++,
          };
        }),
      },
      MidiKey: {
        '@Value': note,
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
  device.Globals.PlaybackMode['@Value'] = koTrack.playMode === 'oneshot' ? 1 : 0;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleRef.FileRef.RelativePath[
    '@Value'
  ] = `Samples/Imported/${koTrack.sampleName}`;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.Name['@Value'] = koTrack.name;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleStart['@Value'] = koTrack.trimLeft;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleEnd['@Value'] = koTrack.trimRight;
  device.VolumeAndPan.Envelope.ReleaseTime.Manual['@Value'] =
    koEnvRangeToSeconds(koTrack.release, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Envelope.AttackTime.Manual['@Value'] =
    koEnvRangeToSeconds(koTrack.attack, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Panorama.Manual['@Value'] = koTrack.pan;
  device.Pitch.TransposeKey.Manual['@Value'] = (koTrack.pitch || 0) + (60 - koTrack.rootNote); // root note of the sample should be taken into account

  if (koTrack.timeStretch === 'bars') {
    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.IsWarped[
      '@Value'
    ] = 'true';
    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.WarpMode[
      '@Value'
    ] = 0; // warp in 'Beats' mode
    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.WarpMarkers.WarpMarker =
      [
        {
          '@Id': 0,
          '@SecTime': 0,
          '@BeatTime': 0,
        },
        {
          '@Id': 1,
          '@SecTime': koTrack.soundLength,
          '@BeatTime': koTrack.timeStretchBars * 4, // convert bars to beats
        },
      ];
  }

  if (koTrack.timeStretch === 'bpm') {
    // calculating beat length using koTrack.timeStretchBpm
    const beatTime = koTrack.soundLength / (60 / koTrack.timeStretchBpm);

    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.IsWarped[
      '@Value'
    ] = 'true';
    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.WarpMode[
      '@Value'
    ] = 0; // warp in 'Beats' mode
    device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.WarpMarkers.WarpMarker =
      [
        {
          '@Id': 0,
          '@SecTime': 0,
          '@BeatTime': 0,
        },
        {
          '@Id': 1,
          '@SecTime': koTrack.soundLength,
          '@BeatTime': beatTime,
        },
      ];
  }

  return device;
}

async function buildTrack(
  koTrack: DawTrack,
  trackIdx: number,
  exporterParams: ExporterParams,
  lanes: DawLane[],
  maxScenes: number,
  trackGroupId: number,
): Promise<ALSMidiTrack> {
  const midiTrackTemplate = await loadTemplate<ALSMidiTrack>('midiTrack');
  const midiTrack = structuredClone(midiTrackTemplate.MidiTrack);

  midiTrack['@Id'] = trackIdx;
  midiTrack.Name.EffectiveName['@Value'] = koTrack.soundId
    ? `${String(koTrack.soundId).padStart(3, '0')} ${koTrack.name}`
    : koTrack.name;
  midiTrack.Name.UserName['@Value'] = midiTrack.Name.EffectiveName['@Value'];
  midiTrack.Color['@Value'] = 8 + trackIdx; // started with 8th color in the Ableton palette, why not
  midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip = [];
  midiTrack.DeviceChain.Mixer.Volume.Manual['@Value'] = koTrack.volume / 2;
  midiTrack.TrackGroupId['@Value'] = trackGroupId;

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
        '@Id': sc,
        LomId: {
          '@Value': 0,
        },
        ClipSlot: {
          Value: {},
        },
      };
      midiTrack.DeviceChain.FreezeSequencer.ClipSlotList.ClipSlot[sc] = {
        '@Id': sc,
        LomId: {
          '@Value': 0,
        },
        ClipSlot: {
          Value: {},
        },
        HasStop: {
          '@Value': 'true',
        },
        NeedRefreeze: {
          '@Value': 'true',
        },
      };
    }
  }

  const koLane = lanes.find((l: DawLane) => l.padCode === koTrack.padCode);

  if (koLane) {
    if (!exporterParams.clips) {
      for (const [clipIdx, koClip] of koLane.clips.entries()) {
        const midiClip = await buildMidiClip(koClip, clipIdx, midiTrack.Color['@Value']);

        midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip.push(
          midiClip,
        );
      }
    } else {
      for (const koClip of koLane.clips.values()) {
        const midiClip = await buildMidiClip(koClip, 0, midiTrack.Color['@Value'], true);

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

  if (exporterParams.groupTracks) {
    midiTrack.DeviceChain.AudioOutputRouting.Target['@Value'] = 'AudioOut/GroupTrack';
    midiTrack.DeviceChain.AudioOutputRouting.UpperDisplayString['@Value'] = 'Group';
  }

  return { MidiTrack: midiTrack };
}

async function buildScenes(scenes: DawScene[], settings: ProjectSettings) {
  const sceneTemplate = await loadTemplate<ALSScene>('scene');
  const result: any[] = [];

  scenes.forEach((scene, idx) => {
    const sceneContent = structuredClone(sceneTemplate.Scene);

    sceneContent['@Id'] = idx;
    sceneContent.Name['@Value'] = scene.name;
    sceneContent.Tempo['@Value'] = settings.bpm;

    result.push(sceneContent);
  });

  return result;
}

async function buildGroupTrack(track: DawTrack, id: number) {
  const groupTrackTemplate = await loadTemplate<ALSGroupTrack>('groupTrack');
  const groupTrack = structuredClone(groupTrackTemplate.GroupTrack);

  groupTrack['@Id'] = id;
  groupTrack.Name.EffectiveName['@Value'] = track.group.toLocaleUpperCase();
  groupTrack.Name.UserName['@Value'] = track.group.toLocaleUpperCase();
  groupTrack.Color['@Value'] = 20 + id;

  return { GroupTrack: groupTrack };
}

async function buildTracks(
  tracks: DawTrack[],
  lanes: DawLane[],
  scenes: DawScene[],
  exporterParams: ExporterParams,
) {
  const result = [];
  let id = 1;
  let trackGroupId = -1;
  let currentGroup = '';

  // if the tracks are grouped, we need to create a group track for each group BEFORE the children midi tracks
  // this took me around 3 hours to figure out
  for (const koTrack of tracks.sort((a, b) => a.group.localeCompare(b.group))) {
    if (exporterParams.groupTracks && koTrack.group !== currentGroup[0]) {
      trackGroupId = id++;
      currentGroup = koTrack.group;

      const groupTrack = await buildGroupTrack(koTrack, trackGroupId);

      result.push(groupTrack);
    }

    const midiTrack = await buildTrack(
      koTrack,
      id++,
      exporterParams,
      lanes,
      scenes.length,
      trackGroupId,
    );

    result.push(midiTrack);
  }

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

  const projectTemplate = await loadTemplate<ALSProject>('project');
  const project = structuredClone(projectTemplate);

  // setting up tempo
  project.Ableton.LiveSet.MasterTrack.DeviceChain.Mixer.Tempo.Manual['@Value'] =
    projectData.settings.bpm;
  project.Ableton.LiveSet.MasterTrack.AutomationEnvelopes.Envelopes.AutomationEnvelope[1].Automation.Events.FloatEvent[
    '@Value'
  ] = projectData.settings.bpm;

  project.Ableton.LiveSet.Tracks['#'] = await buildTracks(
    transformedData.tracks,
    transformedData.lanes,
    transformedData.scenes,
    exporterParams,
  );

  if (exporterParams.clips) {
    project.Ableton.LiveSet.Scenes.Scene = await buildScenes(
      transformedData.scenes,
      projectData.settings,
    );
  }

  const fixedRoot = fixIds(project);
  fixedRoot.Ableton.LiveSet.NextPointeeId['@Value'] = getId() + 1;

  if (import.meta.env.DEV) {
    console.log('ROOT', fixedRoot);
  }

  const newXml = create(fixedRoot).end({ prettyPrint: true });
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
