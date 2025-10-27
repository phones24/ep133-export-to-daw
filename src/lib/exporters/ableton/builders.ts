import { create } from 'xmlbuilder2';
import {
  EffectType,
  ExporterParams,
  FaderParam,
  ProjectRawData,
  ProjectSettings,
} from '../../../types/types';
import { EFFECTS } from '../../constants';
import abletonTransformer, { AblClip, AblScene, AblTrack } from '../../transformers/ableton';
import { getQuarterNotesPerBar } from '../utils';
import { ALSDrumBranch } from './types/drumBranch';
import { ALSDrumRack } from './types/drumRack';
import { ALSChorus } from './types/effectChorus';
import { ALSCompressor } from './types/effectCompressor';
import { ALSDelay } from './types/effectDelay';
import { ALSDistortion } from './types/effectDistortion';
import { ALSFilter } from './types/effectFilter';
import { ALSMidiPitcher } from './types/effectMidiPitcher';
import { ALSReverb } from './types/effectReverb';
import { ALSGroupTrack } from './types/groupTrack';
import { ALSMidiClip, ALSMidiClipContent } from './types/midiClip';
import { ALSMidiTrack } from './types/midiTrack';
import { ALSProject } from './types/project';
import { ALSReturnTrack } from './types/returnTrack';
import { ALSMultiSamplerContent, ALSSampler } from './types/sampler';
import { ALSScene, ALSSceneContent } from './types/scene';
import { ALSOriginalSimplerContent, ALSSimpler } from './types/simpler';
import { ALSTrackSendHolder } from './types/trackSendHolder';
import {
  fixIds,
  getId,
  gzipString,
  koEnvRangeToSeconds,
  loadTemplate,
  TIME_SIGNATURES,
} from './utils';

let _localId = -1;
let _localGroupId = -1;
let _localTrackColor = -1;
let _localGroupTrackColor = -1;

async function buildMidiClip(
  koClip: AblClip,
  clipIdx: number,
  color: number,
  clipForLauncher: boolean = false,
): Promise<ALSMidiClipContent> {
  const midiClipTemplate = await loadTemplate<ALSMidiClip>('midiClip');
  const midiClip = structuredClone(midiClipTemplate.MidiClip);

  const beats = getQuarterNotesPerBar(
    koClip.timeSignature.numerator,
    koClip.timeSignature.denominator,
  );
  const time = koClip.offset * beats;
  const start = time;
  const end = time + koClip.sceneBars * beats;

  midiClip['@Id'] = clipIdx;
  midiClip['@Time'] = time;
  midiClip.CurrentStart['@Value'] = start;
  midiClip.CurrentEnd['@Value'] = end;
  midiClip.Loop.LoopOn['@Value'] = 'true';
  midiClip.Loop.LoopStart['@Value'] = 0;
  midiClip.Loop.LoopEnd['@Value'] = koClip.bars * beats;
  midiClip.Loop.HiddenLoopStart['@Value'] = 0;
  midiClip.Loop.HiddenLoopEnd['@Value'] = koClip.bars * beats;
  midiClip.Color['@Value'] = color;
  midiClip.Name['@Value'] = `Scene ${koClip.sceneName}`;
  midiClip.TimeSignature.TimeSignatures.RemoteableTimeSignature.Numerator['@Value'] =
    koClip.timeSignature.numerator;
  midiClip.TimeSignature.TimeSignatures.RemoteableTimeSignature.Denominator['@Value'] =
    koClip.timeSignature.denominator;

  if (clipForLauncher) {
    midiClip['@Time'] = 0;
    midiClip.CurrentStart['@Value'] = 0;
    midiClip.CurrentEnd['@Value'] = koClip.bars * beats;
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
            // '@Velocity': (note.velocity / 127) * 100, // 127 velocity is too loud in Ableton
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
  // device.Player.MultiSampleMap.SampleParts.MultiSamplePart.RootKey['@Value'] = koTrack.rootNote;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleStart['@Value'] = koTrack.trimLeft;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleEnd['@Value'] = koTrack.trimRight;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.TimeSignature.TimeSignatures.RemoteableTimeSignature.Numerator[
    '@Value'
  ] = koTrack.timeSignature.numerator;
  device.Player.MultiSampleMap.SampleParts.MultiSamplePart.SampleWarpProperties.TimeSignature.TimeSignatures.RemoteableTimeSignature.Denominator[
    '@Value'
  ] = koTrack.timeSignature.denominator;

  device.VolumeAndPan.Envelope.ReleaseTime.Manual['@Value'] =
    koEnvRangeToSeconds(koTrack.release, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Envelope.AttackTime.Manual['@Value'] =
    koEnvRangeToSeconds(koTrack.attack, koTrack.soundLength) * 1000;
  device.VolumeAndPan.Panorama.Manual['@Value'] = koTrack.pan;
  device.Pitch.TransposeKey.Manual['@Value'] =
    (koTrack.pitch || 0) + koTrack.samplePitch + (60 - koTrack.rootNote); // root note of the sample should be taken into account

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
          '@BeatTime': koTrack.timeStretchBars * koTrack.timeSignature.numerator, // convert bars to beats
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

async function buildEffectMidiPitcher(koTrack: AblTrack) {
  const effectMidiPitcherTemplate = await loadTemplate<ALSMidiPitcher>('effectMidiPitcher');
  const device = structuredClone(effectMidiPitcherTemplate.MidiPitcher);
  const normalized = koTrack.faderParams[FaderParam.PTC] * 2 - 1;

  device.Pitch.Manual['@Value'] = Math.round(normalized * 5);

  return {
    MidiPitcher: device,
  };
}

async function buildTrack(
  koTrack: AblTrack,
  maxScenes: number,
  trackGroupId: number,
  exporterParams: ExporterParams,
): Promise<ALSMidiTrack> {
  const midiTrackTemplate = await loadTemplate<ALSMidiTrack>('midiTrack');
  const midiTrack = structuredClone(midiTrackTemplate.MidiTrack);

  midiTrack['@Id'] = _localId++;
  midiTrack.Name.EffectiveName['@Value'] = koTrack.soundId
    ? `${String(koTrack.soundId).padStart(3, '0')} ${koTrack.name}`
    : koTrack.name;
  midiTrack.Name.UserName['@Value'] = midiTrack.Name.EffectiveName['@Value'];
  midiTrack.Color['@Value'] = 8 + _localTrackColor++; // started with 8th color in the Ableton palette, why not
  midiTrack.DeviceChain.MainSequencer.ClipTimeable.ArrangerAutomation.Events.MidiClip = [];
  midiTrack.DeviceChain.Mixer.Volume.Manual['@Value'] = koTrack.volume / 2;
  midiTrack.TrackGroupId['@Value'] = trackGroupId;
  midiTrack.DeviceChain.DeviceChain.Devices['#'] = [];

  if (koTrack.faderParams[FaderParam.PTC] !== -1) {
    midiTrack.DeviceChain.DeviceChain.Devices['#'].push(await buildEffectMidiPitcher(koTrack));
  }

  if (koTrack.drumRack && exporterParams.includeArchivedSamples) {
    midiTrack.DeviceChain.DeviceChain.Devices['#'].push(await buildDrumRackDevice(koTrack));
  }

  if (!koTrack.drumRack && koTrack.sampleName && exporterParams.includeArchivedSamples) {
    midiTrack.DeviceChain.DeviceChain.Devices['#'].push(
      await buildSamplerDevice(koTrack, exporterParams.useSampler),
    );
  }

  // make sure id's are sequential in device chain
  midiTrack.DeviceChain.DeviceChain.Devices['#'].forEach((device, deviceIdx) => {
    Object.values(device).forEach((devContent: any) => {
      devContent['@Id'] = deviceIdx;
    });
  });

  // make sure each tracks has the same empty slots for clips
  // must be equeal to GroupTrackSlot if this track is in a group
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

  if (exporterParams.sendEffects && !exporterParams.groupTracks) {
    const trackSendHolderTemplate = await loadTemplate<ALSTrackSendHolder>('trackSendHolder');
    const trackSendHolder = structuredClone(trackSendHolderTemplate.TrackSendHolder);

    trackSendHolder.Send.Manual['@Value'] = koTrack.faderParams[FaderParam.FX];

    midiTrack.DeviceChain.Mixer.Sends.TrackSendHolder = trackSendHolder;
  }

  return { MidiTrack: midiTrack };
}

async function buildGroupTrack(
  koTrack: AblTrack,
  exporterParams: ExporterParams,
  maxScenes: number,
) {
  const groupTrackTemplate = await loadTemplate<ALSGroupTrack>('groupTrack');
  const groupTrack = structuredClone(groupTrackTemplate.GroupTrack);

  groupTrack['@Id'] = _localGroupId++;
  groupTrack.Name.EffectiveName['@Value'] = koTrack.group.toLocaleUpperCase();
  groupTrack.Name.UserName['@Value'] = koTrack.group.toLocaleUpperCase();
  groupTrack.Color['@Value'] = 5 + _localGroupTrackColor++;
  groupTrack.Slots.GroupTrackSlot = [];

  // adding empty slots for clips (or Ableton will crash)
  for (let sc = 0; sc < maxScenes; sc++) {
    groupTrack.Slots.GroupTrackSlot.push({
      '@Id': sc,
      LomId: {
        '@Value': 0,
      },
    });
  }

  if (exporterParams.sendEffects) {
    const trackSendHolderTemplate = await loadTemplate<ALSTrackSendHolder>('trackSendHolder');
    const trackSendHolder = structuredClone(trackSendHolderTemplate.TrackSendHolder);

    trackSendHolder.Send.Manual['@Value'] = koTrack.faderParams[FaderParam.FX];

    groupTrack.DeviceChain.Mixer.Sends.TrackSendHolder = trackSendHolder;
  }

  return { GroupTrack: groupTrack };
}

async function buildScenes(scenes: AblScene[], settings: ProjectSettings) {
  const sceneTemplate = await loadTemplate<ALSScene>('scene');
  const result: ALSSceneContent[] = [];

  scenes.forEach((scene) => {
    const sceneContent = structuredClone(sceneTemplate.Scene);

    sceneContent['@Id'] = _localId++;
    sceneContent.Name['@Value'] = scene.name;
    sceneContent.Tempo['@Value'] = settings.bpm;

    result.push(sceneContent);
  });

  return result;
}

async function buildTracks(tracks: AblTrack[], maxScenes: number, exporterParams: ExporterParams) {
  const result = [];
  let trackGroupId = -1;
  let currentGroup = '';

  // if the tracks are grouped, we need to create a group track for each group BEFORE the children midi tracks
  // this took me around 3 hours to figure out
  for (const koTrack of tracks.sort((a, b) => a.group.localeCompare(b.group))) {
    if (exporterParams.groupTracks && koTrack.group !== currentGroup[0]) {
      currentGroup = koTrack.group;
      const groupTrack = await buildGroupTrack(koTrack, exporterParams, maxScenes);
      trackGroupId = groupTrack.GroupTrack['@Id'];
      result.push(groupTrack);
    }

    const midiTrack = await buildTrack(koTrack, maxScenes, trackGroupId, exporterParams);

    result.push(midiTrack);
  }

  return result;
}

async function buildReturnTrack(projectData: ProjectRawData, trackId: number = 0) {
  const returnTrackTemplate = await loadTemplate<ALSReturnTrack>('returnTrack');
  const returnTrack = structuredClone(returnTrackTemplate.ReturnTrack);

  returnTrack['@Id'] = trackId;
  returnTrack.Name.EffectiveName['@Value'] = EFFECTS[projectData.effects.effectType] || '';
  returnTrack.Name.UserName['@Value'] = EFFECTS[projectData.effects.effectType] || '';
  returnTrack.Color['@Value'] = 28;

  if (projectData.effects.effectType === EffectType.Reverb) {
    const effectReverbTemplate = await loadTemplate<ALSReverb>('effectReverb');
    const effectReverb = structuredClone(effectReverbTemplate.Reverb);

    // these params are very rough approximation of the KO's reverb
    // it's not exact, but close enough
    effectReverb.PreDelay.Manual['@Value'] = 0.5;
    effectReverb.RoomSize.Manual['@Value'] = 300;
    effectReverb.ShelfHiFreq.Manual['@Value'] = 1000;
    effectReverb.DecayTime.Manual['@Value'] = projectData.effects.param1 * 8000; // max 8 seconds which is kinda close to how it sounds in KO
    effectReverb.ShelfHiGain.Manual['@Value'] = projectData.effects.param2; // param2 is "color" which roughly matches the high shelf gain cut amount

    returnTrack.DeviceChain.DeviceChain.Devices = { Reverb: effectReverb };
  }

  if (projectData.effects.effectType === EffectType.Delay) {
    const effectDelayTemplate = await loadTemplate<ALSDelay>('effectDelay');
    const effectDelay = structuredClone(effectDelayTemplate.Delay);

    effectDelay.DelayLine_SyncL.Manual['@Value'] = 'false';
    effectDelay.DelayLine_SyncR.Manual['@Value'] = 'false';
    // don't even ask how I came up with this formula
    effectDelay.DelayLine_TimeL.Manual['@Value'] =
      0.017397 * (287.725 ** projectData.effects.param1 - 1);
    effectDelay.DelayLine_TimeR.Manual['@Value'] =
      0.017397 * (287.725 ** projectData.effects.param1 - 1);
    effectDelay.Feedback.Manual['@Value'] = projectData.effects.param2;

    returnTrack.DeviceChain.DeviceChain.Devices = { Delay: effectDelay };
  }

  if (projectData.effects.effectType === EffectType.Distortion) {
    const effectDistortionTemplate = await loadTemplate<ALSDistortion>('effectDistortion');
    const effectDistortion = structuredClone(effectDistortionTemplate.Overdrive);

    effectDistortion.Drive.Manual['@Value'] = projectData.effects.param1 * 50;
    effectDistortion.Tone.Manual['@Value'] = projectData.effects.param2 * 100;

    returnTrack.DeviceChain.DeviceChain.Devices = { Overdrive: effectDistortion };
  }

  if (projectData.effects.effectType === EffectType.Chorus) {
    const effectChorusTemplate = await loadTemplate<ALSChorus>('effectChorus');
    const effectChorus = structuredClone(effectChorusTemplate.Chorus2);

    effectChorus.Amount.Manual['@Value'] = projectData.effects.param1;
    effectChorus.Feedback.Manual['@Value'] = projectData.effects.param2 * 0.8;

    returnTrack.DeviceChain.DeviceChain.Devices = { Chorus2: effectChorus };
  }

  // putting a filter in return track is absolutely pointless, but hey, why not
  if (projectData.effects.effectType === EffectType.Filter) {
    const effectFilterTemplate = await loadTemplate<ALSFilter>('effectFilter');
    const effectFilter = structuredClone(effectFilterTemplate.AutoFilter);

    effectFilter.Cutoff.Manual['@Value'] = 20 + projectData.effects.param1 * (135 - 20);
    effectFilter.Resonance.Manual['@Value'] = projectData.effects.param2 * 1.25;

    returnTrack.DeviceChain.DeviceChain.Devices = { AutoFilter: effectFilter };
  }

  if (projectData.effects.effectType === EffectType.Compressor) {
    const effectCompressorTemplate = await loadTemplate<ALSCompressor>('effectCompressor');
    const effectCompressor = structuredClone(effectCompressorTemplate.Compressor2);

    // params are ignored for now, just putting a basic compressor

    returnTrack.DeviceChain.DeviceChain.Devices = { Compressor2: effectCompressor };
  }

  return { ReturnTrack: returnTrack };
}

export async function buildProject(projectData: ProjectRawData, exporterParams: ExporterParams) {
  const transformedData = abletonTransformer(projectData, exporterParams);

  if (import.meta.env.DEV) {
    console.log('projectData', projectData);
    console.log('transformedData', transformedData);
  }

  // reset local ids
  _localId = 1;
  _localGroupId = 50;
  _localTrackColor = 1;
  _localGroupTrackColor = 1;

  const projectTemplate = await loadTemplate<ALSProject>('project');
  const project = structuredClone(projectTemplate);

  // setting up tempo
  project.Ableton.LiveSet.MasterTrack.DeviceChain.Mixer.Tempo.Manual['@Value'] =
    projectData.settings.bpm;
  project.Ableton.LiveSet.MasterTrack.AutomationEnvelopes.Envelopes.AutomationEnvelope[1].Automation.Events.FloatEvent[
    '@Value'
  ] = projectData.settings.bpm;
  // setting up time signature
  project.Ableton.LiveSet.MasterTrack.AutomationEnvelopes.Envelopes.AutomationEnvelope[0].Automation.Events.EnumEvent[
    '@Value'
  ] =
    TIME_SIGNATURES[
      `${projectData.scenesSettings.timeSignature.numerator}/${projectData.scenesSettings.timeSignature.denominator}`
    ] || TIME_SIGNATURES['4/4'];

  project.Ableton.LiveSet.Tracks['#'] = await buildTracks(
    transformedData.tracks,
    transformedData.scenes.length,
    exporterParams,
  );

  if (exporterParams.sendEffects) {
    const returnTrack = await buildReturnTrack(
      projectData,
      project.Ableton.LiveSet.Tracks['#'].length + 1,
    );

    project.Ableton.LiveSet.Tracks['#'].push(returnTrack);
  }

  if (exporterParams.clips) {
    project.Ableton.LiveSet.Scenes.Scene = await buildScenes(
      transformedData.scenes,
      projectData.settings,
    );
  }

  if (exporterParams.sendEffects) {
    project.Ableton.LiveSet.SendsPre = {
      SendPreBool: {
        '@Id': 1,
        '@Value': 'false',
      },
    };
  }

  const fixedRoot = fixIds(project);
  fixedRoot.Ableton.LiveSet.NextPointeeId['@Value'] = getId() + 1;

  if (import.meta.env.DEV) {
    console.log('ROOT', fixedRoot);
  }

  const newXml = create(fixedRoot).end({ prettyPrint: true, indent: '\t' });
  const gzipped = gzipString(newXml);

  return gzipped;
}
