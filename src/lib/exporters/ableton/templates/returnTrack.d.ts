import { ALSChorus } from './effectChorus';
import { ALSCompressor } from './effectCompressor';
import { ALSDelay } from './effectDelay';
import { ALSDistortion } from './effectDistortion';
import { ALSFilter } from './effectFilter';
import { ALSReverb } from './effectReverb';

interface ValueElement {
  '@Value': any;
}

interface LomIdElement {
  LomId: ValueElement;
}

interface ManualElement extends LomIdElement {
  Manual: ValueElement;
  MidiControllerRange?: {
    Min: ValueElement;
    Max: ValueElement;
  };
  AutomationTarget: {
    '@Id': number;
    LockEnvelope: ValueElement;
  };
  ModulationTarget?: {
    '@Id': number;
    LockEnvelope: ValueElement;
  };
  MidiCCOnOffThresholds?: {
    Min: ValueElement;
    Max: ValueElement;
  };
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
}

interface AutomationLane {
  '@Id': number;
  SelectedDevice: ValueElement;
  SelectedEnvelope: ValueElement;
  IsContentSelectedInDocument: ValueElement;
  LaneHeight: ValueElement;
}

interface AutomationLanes {
  AutomationLane: AutomationLane[];
  AreAdditionalAutomationLanesFolded: ValueElement;
}

interface ClipEnvelopeChooserViewState {
  SelectedDevice: ValueElement;
  SelectedEnvelope: ValueElement;
  PreferModulationVisible: ValueElement;
}

interface TrackSendHolder {
  '@Id': number;
  Send: ManualElement;
  Active: ValueElement;
}

interface Sends {
  TrackSendHolder: TrackSendHolder[];
}

interface Mixer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
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
  Sends: Sends;
  Speaker: ManualElement;
  SoloSink: ValueElement;
  PanMode: ValueElement;
  Pan: ManualElement;
  SplitStereoPanL: ManualElement;
  SplitStereoPanR: ManualElement;
  Volume: ManualElement;
  ViewStateSesstionTrackWidth: ValueElement;
  CrossFadeState: ManualElement;
  SendsListWrapper: LomIdElement;
}

interface Sample {
  ArrangerAutomation: {
    Events: {};
    AutomationTransformViewState: {
      IsTransformPending: ValueElement;
      TimeAndValueTransforms: {};
    };
  };
}

interface FreezeSequencer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
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
  ClipSlotList: {};
  MonitoringEnum: ValueElement;
  Sample: Sample;
  VolumeModulationTarget: {
    '@Id': number;
    LockEnvelope: ValueElement;
  };
  TranspositionModulationTarget: {
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
  PitchViewScrollPosition: ValueElement;
  SampleOffsetModulationScrollPosition: ValueElement;
  Recorder: {
    IsArmed: ValueElement;
    TakeCounter: ValueElement;
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

interface AutomationEnvelopes {
  Envelopes: {};
}

interface TakeLanes {
  TakeLanes: {};
  AreTakeLanesFolded: ValueElement;
}

type EffectDevice = ALSChorus | ALSCompressor | ALSDelay | ALSDistortion | ALSFilter | ALSReverb;

interface DeviceChain {
  AutomationLanes: AutomationLanes;
  ClipEnvelopeChooserViewState: ClipEnvelopeChooserViewState;
  AudioInputRouting: Routing;
  MidiInputRouting: Routing;
  AudioOutputRouting: Routing;
  MidiOutputRouting: Routing;
  Mixer: Mixer;
  DeviceChain: {
    Devices: EffectDevice;
    SignalModulations: {};
  };
  FreezeSequencer: FreezeSequencer;
}

export interface ALSReturnTrackContent {
  '@Id': number;
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
  ViewData: ValueElement;
  TakeLanes: TakeLanes;
  LinkedTrackGroupId: ValueElement;
  DeviceChain: DeviceChain;
}

export interface ALSReturnTrack {
  ReturnTrack: ALSReturnTrackContent;
}
