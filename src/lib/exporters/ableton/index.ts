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
import abletonTransformer, { AblClip, AblScene, AblTrack } from '../../transformers/ableton';
import { AbortError } from '../../utils';
import { collectSamples } from '../utils';
import { ALSDrumBranch } from './templates/drumBranch';
import { ALSDrumRack } from './templates/drumRack';
import { ALSGroupTrack } from './templates/groupTrack';
import { ALSMidiClip, ALSMidiClipContent } from './templates/midiClip';
import { ALSMidiTrack } from './templates/midiTrack';
import { ALSProject } from './templates/project';
import { ALSMultiSamplerContent, ALSSampler } from './templates/sampler';
import { ALSScene, ALSSceneContent } from './templates/scene';
import { ALSOriginalSimplerContent, ALSSimpler } from './templates/simpler';
import { fixIds, getId, gzipString, koEnvRangeToSeconds, loadTemplate } from './utils';

async function buildMidiClip(
  koClip: AblClip,
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

async function buildSamplerDevice(koTrack: AblTrack, useSampler = false) {
  const [samplerTemplate, simplerTemplate] = await Promise.all([
    loadTemplate<ALSSampler>('sampler'),
    loadTemplate<ALSSimpler>('simpler'),
  ]);

  let device: ALSMultiSamplerContent | ALSOriginalSimplerContent;

  if (useSampler) {
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

  return {
    [useSampler ? 'MultiSampler' : 'OriginalSimpler']: device,
  };
}

async function buildDrumRackDevice(koTrack: AblTrack) {
  const [drumRackTemplate, drumBranchTemplate] = await Promise.all([
    loadTemplate<ALSDrumRack>('drumRack'),
    loadTemplate<ALSDrumBranch>('drumBranch'),
  ]);

  const device = structuredClone(drumRackTemplate.DrumGroupDevice);

  device.Branches.DrumBranch = [];

  for (const [idx, subtrack] of koTrack.tracks.entries()) {
    if (!subtrack.sampleName) {
      continue;
    }

    const drumBranch = structuredClone(drumBranchTemplate.DrumBranch);
    const note = 92 - idx; // 92 is the number of slot for C1 in the drum rack and it goes down

    drumBranch['@Id'] = idx;
    drumBranch.Name.EffectiveName['@Value'] = subtrack.name;
    drumBranch.Name.UserName['@Value'] = subtrack.name;
    drumBranch.BranchInfo.ReceivingNote['@Value'] = note;
    drumBranch.BranchInfo.SendingNote['@Value'] = 60; // not sure if this matters
    drumBranch.BranchInfo.ChokeGroup['@Value'] = subtrack.inChokeGroup ? 1 : 0;
    drumBranch.DeviceChain.MidiToAudioDeviceChain.Devices = await buildSamplerDevice(subtrack);

    device.Branches.DrumBranch.push(drumBranch);
  }

  return {
    DrumGroupDevice: device,
  };
}

async function buildTrack(
  koTrack: AblTrack,
  trackIdx: number,
  exporterParams: ExporterParams,
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

  if (koTrack.drumRack && exporterParams.includeArchivedSamples) {
    midiTrack.DeviceChain.DeviceChain.Devices = await buildDrumRackDevice(koTrack);
  }

  if (!koTrack.drumRack && koTrack.sampleName && exporterParams.includeArchivedSamples) {
    midiTrack.DeviceChain.DeviceChain.Devices = await buildSamplerDevice(
      koTrack,
      exporterParams.useSampler,
    );
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

  if (koTrack.lane) {
    if (!exporterParams.clips) {
      for (const [clipIdx, koClip] of koTrack.lane.clips.entries()) {
        const midiClip = await buildMidiClip(koClip, clipIdx, midiTrack.Color['@Value']);

        midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip.push(
          midiClip,
        );
      }
    } else {
      for (const koClip of koTrack.lane.clips.values()) {
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

async function buildScenes(scenes: AblScene[], settings: ProjectSettings) {
  const sceneTemplate = await loadTemplate<ALSScene>('scene');
  const result: ALSSceneContent[] = [];

  scenes.forEach((scene, idx) => {
    const sceneContent = structuredClone(sceneTemplate.Scene);

    sceneContent['@Id'] = idx;
    sceneContent.Name['@Value'] = scene.name;
    sceneContent.Tempo['@Value'] = settings.bpm;

    result.push(sceneContent);
  });

  return result;
}

async function buildGroupTrack(track: AblTrack, id: number) {
  const groupTrackTemplate = await loadTemplate<ALSGroupTrack>('groupTrack');
  const groupTrack = structuredClone(groupTrackTemplate.GroupTrack);

  groupTrack['@Id'] = id;
  groupTrack.Name.EffectiveName['@Value'] = track.group.toLocaleUpperCase();
  groupTrack.Name.UserName['@Value'] = track.group.toLocaleUpperCase();
  groupTrack.Color['@Value'] = 20 + id;

  return { GroupTrack: groupTrack };
}

async function buildTracks(tracks: AblTrack[], maxScenes: number, exporterParams: ExporterParams) {
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

    const midiTrack = await buildTrack(koTrack, id++, exporterParams, maxScenes, trackGroupId);

    result.push(midiTrack);
  }

  return result;
}

async function buildProject(
  projectData: ProjectRawData,
  sounds: Sound[],
  exporterParams: ExporterParams,
) {
  const transformedData = abletonTransformer(projectData, sounds, exporterParams);

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
    transformedData.scenes.length,
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
  abortSignal: AbortSignal,
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

  if (abortSignal.aborted) {
    throw new AbortError();
  }

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
      abortSignal,
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
