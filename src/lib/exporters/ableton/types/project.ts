import {
  AutomationTarget,
  LomIdElement,
  MidiCCOnOffThresholds,
  MidiControllerRange,
  ModulationTarget,
  ValueElement,
} from './common';
import type { ALSGroupTrack } from './groupTrack';
import type { ALSMidiTrack } from './midiTrack';
import type { ALSReturnTrack } from './returnTrack';
import { ALSSceneContent } from './scene';

interface ManualElement extends LomIdElement {
  Manual: ValueElement;
  MidiControllerRange?: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget?: ModulationTarget;
  MidiCCOnOffThresholds?: MidiCCOnOffThresholds;
}

interface Routing {
  Target: ValueElement;
  UpperDisplayString: ValueElement;
  LowerDisplayString: ValueElement;
  MpeSettings: {
    ZoneType: ValueElement;
    FirstNoteChannel: ValueElement;
    LastNoteChannel: ValueElement;
  };
  MpePitchBendUsesTuning: ValueElement;
}

interface AutomationLane {
  '@Id': number;
  SelectedDevice: ValueElement;
  SelectedEnvelope: ValueElement;
  IsContentSelectedInDocument: ValueElement;
  LaneHeight: ValueElement;
}

interface AutomationLanes {
  AutomationLanes: {
    AutomationLane: AutomationLane[];
  };
  AreAdditionalAutomationLanesFolded: ValueElement;
}

interface ClipEnvelopeChooserViewState {
  SelectedDevice: ValueElement;
  SelectedEnvelope: ValueElement;
  PreferModulationVisible: ValueElement;
}

interface Mixer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
  BreakoutIsExpanded: ValueElement;
  On: ManualElement;
  ModulationSourceCount: ValueElement;
  ParametersListWrapper: LomIdElement;
  Pointee: {
    '@Id': number;
  };
  LastSelectedTimeableIndex: ValueElement;
  LastSelectedClipEnvelopeIndex: ValueElement;
  LastPresetRef: {
    Value: {};
  };
  LockedScripts: {};
  IsFolded: ValueElement;
  ShouldShowPresetName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  SourceContext: {
    Value: {};
  };
  MpePitchBendUsesTuning: ValueElement;
  Sends: {};
  Speaker: ManualElement;
  SoloSink: ValueElement;
  PanMode: ValueElement;
  Pan: ManualElement;
  SplitStereoPanL: ManualElement;
  SplitStereoPanR: ManualElement;
  Volume: ManualElement;
  ViewStateSessionTrackWidth: ValueElement;
  CrossFadeState: ManualElement;
  SendsListWrapper: LomIdElement;
  Tempo: ManualElement;
}

interface DeviceChain {
  AutomationLanes: AutomationLanes;
  ClipEnvelopeChooserViewState: ClipEnvelopeChooserViewState;
  AudioInputRouting: Routing;
  MidiInputRouting: Routing;
  AudioOutputRouting: Routing;
  MidiOutputRouting: Routing;
  Mixer: Mixer;
  MainSequencer: {
    LomId: ValueElement;
    LomIdView: ValueElement;
    IsExpanded: ValueElement;
    BreakoutIsExpanded: ValueElement;
    On: ManualElement;
    ModulationSourceCount: ValueElement;
    ParametersListWrapper: LomIdElement;
    Pointee: {
      '@Id': number;
    };
    LastSelectedTimeableIndex: ValueElement;
    LastSelectedClipEnvelopeIndex: ValueElement;
    LastPresetRef: {
      Value: {};
    };
    LockedScripts: {};
    IsFolded: ValueElement;
    ShouldShowPresetName: ValueElement;
    UserName: ValueElement;
    Annotation: ValueElement;
    SourceContext: {
      Value: {};
    };
    MpePitchBendUsesTuning: ValueElement;
    ClipSlotList: {
      ClipSlot: any[]; // Empty in template
    };
    MonitoringEnum: ValueElement;
    KeepRecordMonitoringLatency: ValueElement;
    ClipTimeable: {
      ArrangerAutomation: {
        Events: {
          MidiClip: any[]; // Empty in template
        };
        AutomationTransformViewState: {
          IsTransformPending: ValueElement;
          TimeAndValueTransforms: {};
        };
      };
    };
    Recorder: {
      IsArmed: ValueElement;
      TakeCounter: ValueElement;
    };
    MidiControllers: {};
  };
  FreezeSequencer: {
    LomId: ValueElement;
    LomIdView: ValueElement;
    IsExpanded: ValueElement;
    BreakoutIsExpanded: ValueElement;
    On: ManualElement;
    ModulationSourceCount: ValueElement;
    ParametersListWrapper: LomIdElement;
    Pointee: {
      '@Id': number;
    };
    LastSelectedTimeableIndex: ValueElement;
    LastSelectedClipEnvelopeIndex: ValueElement;
    LastPresetRef: {
      Value: {};
    };
    LockedScripts: {};
    IsFolded: ValueElement;
    ShouldShowPresetName: ValueElement;
    UserName: ValueElement;
    Annotation: ValueElement;
    SourceContext: {
      Value: {};
    };
    MpePitchBendUsesTuning: ValueElement;
    ClipSlotList: {
      ClipSlot: any[]; // Empty in template
    };
    MonitoringEnum: ValueElement;
    KeepRecordMonitoringLatency: ValueElement;
    Sample: {
      ArrangerAutomation: {
        Events: {};
        AutomationTransformViewState: {
          IsTransformPending: ValueElement;
          TimeAndValueTransforms: {};
        };
      };
    };
    VolumeModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    TranspositionModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    TransientEnvelopeModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    GrainSizeModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    FluxModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    SampleOffsetModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    ComplexProFormantsModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    ComplexProEnvelopeModulationTarget: {
      '@Id': number;
      LockEnvelope: ValueElement;
    };
    PitchViewScrollPosition: ValueElement;
    SampleOffsetModulationScrollPosition: ValueElement;
    Recorder: {
      IsArmed: ValueElement;
      TakeCounter: ValueElement;
    };
  };
  DeviceChain: {
    Devices: {};
    SignalModulations: {};
  };
}

interface Name {
  EffectiveName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  MemorizedFirstClipName: ValueElement;
}

interface TrackDelay {
  Value: ValueElement;
  IsValueSampleBased: ValueElement;
}

interface TakeLanes {
  TakeLanes: {};
  AreTakeLanesFolded: ValueElement;
}

interface AutomationEnvelope {
  '@Id': number;
  EnvelopeTarget: {
    PointeeId: ValueElement;
  };
  Automation: {
    Events: {
      EnumEvent: {
        '@Id': number;
        '@Time': number;
        '@Value': number;
      };
      FloatEvent: {
        '@Id': number;
        '@Time': number;
        '@Value': number;
      };
    };
    AutomationTransformViewState: {
      IsTransformPending: ValueElement;
      TimeAndValueTransforms: {};
    };
  };
}

interface AutomationEnvelopes {
  Envelopes: {
    AutomationEnvelope: AutomationEnvelope[];
  };
}

interface MasterTrack {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsContentSelectedInDocument: ValueElement;
  PreferredContentViewMode: ValueElement;
  TrackDelay: TrackDelay;
  Name: Name;
  Color: ValueElement;
  AutomationEnvelopes: AutomationEnvelopes;
  TrackGroupId: ValueElement;
  TrackUnfolded: ValueElement;
  DevicesListWrapper: LomIdElement;
  ClipSlotsListWrapper: LomIdElement;
  ArrangementClipsListWrapper: LomIdElement;
  TakeLanesListWrapper: LomIdElement;
  ViewData: ValueElement;
  TakeLanes: TakeLanes;
  LinkedTrackGroupId: ValueElement;
  DeviceChain: DeviceChain;
}

interface GroovePool {
  Grooves: {
    Groove: any[];
  };
}

interface AutoColorPicker {
  NextColorIndex: ValueElement;
}

interface VideoWindowRect {
  '@Top': number;
  '@Left': number;
  '@Bottom': number;
  '@Right': number;
}

interface LiveSet {
  NextPointeeId: ValueElement;
  OverwriteProtectionNumber: ValueElement;
  LomId: ValueElement;
  LomIdView: ValueElement;
  Tracks: {
    '#': (ALSMidiTrack | ALSGroupTrack | ALSReturnTrack)[];
  };
  MasterTrack: MasterTrack;
  GroovePool: GroovePool;
  AutomationMode: ValueElement;
  SnapAutomationToGrid: ValueElement;
  ArrangementOverdub: ValueElement;
  ColorSequenceIndex: ValueElement;
  AutoColorPickerForPlayerAndGroupTracks: AutoColorPicker;
  AutoColorPickerForReturnAndMasterTracks: AutoColorPicker;
  ViewData: ValueElement;
  ResetNonautomatedMidiControllersOnClipStarts: ValueElement;
  MidiFoldIn: ValueElement;
  MidiFoldMode: ValueElement;
  MultiClipFocusMode: ValueElement;
  MultiClipLoopBarHeight: ValueElement;
  MidiPrelisten: ValueElement;
  LinkedTrackGroups: {};
  AccidentalSpellingPreference: ValueElement;
  PreferFlatRootNote: ValueElement;
  UseWarperLegacyHiQMode: ValueElement;
  VideoWindowRect: VideoWindowRect;
  ShowVideoWindow: ValueElement;
  TrackHeaderWidth: ValueElement;
  ViewStates: {};
  Scenes: {
    Scene: ALSSceneContent[];
  };
  SendsPre: {
    SendPreBool: {
      '@Id': number;
      '@Value': string;
    };
  };
}

interface Ableton {
  '@MajorVersion': string;
  '@MinorVersion': string;
  '@SchemaChangeCount': string;
  '@Creator': string;
  '@Revision': string;
  LiveSet: LiveSet;
}

export interface ALSProject {
  Ableton: Ableton;
}
