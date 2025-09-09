// Types for midiTrack.xml template
interface ValueElement {
  _attrs: {
    Value: any;
  };
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
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  ModulationTarget?: {
    _attrs: { Id: number };
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
  MpePitchBendUsesTuning: ValueElement;
}

interface AutomationLane {
  _attrs: { Id: number };
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

interface Mixer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
  BreakoutIsExpanded: ValueElement;
  On: ManualElement;
  ModulationSourceCount: ValueElement;
  ParametersListWrapper: {
    LomId: ValueElement;
  };
  Pointee: {
    _attrs: { Id: number };
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
  SendsListWrapper: {
    LomId: ValueElement;
  };
}

interface ClipSlot {
  _attrs: { Id: number };
  LomId: ValueElement;
  ClipSlot: {
    Value?: MidiClip;
  };
  HasStop?: ValueElement;
  NeedRefreeze?: ValueElement;
}

interface ClipSlotList {
  ClipSlot: ClipSlot[];
}

interface MidiClip {
  [key: string]: any;
}

interface ArrangerAutomation {
  Events: {
    MidiClip: MidiClip[];
  };
  AutomationTransformViewState: {
    IsTransformPending: ValueElement;
    TimeAndValueTransforms: {};
  };
}

interface ClipTimeable {
  ArrangerAutomation: ArrangerAutomation;
}

interface Recorder {
  IsArmed: ValueElement;
  TakeCounter: ValueElement;
}

interface ControllerTarget {
  _attrs: { Id: number };
  LockEnvelope: ValueElement;
}

interface MidiControllers {
  [key: string]: ControllerTarget;
}

interface MainSequencer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
  BreakoutIsExpanded: ValueElement;
  On: ManualElement;
  ModulationSourceCount: ValueElement;
  ParametersListWrapper: {
    LomId: ValueElement;
  };
  Pointee: {
    _attrs: { Id: number };
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
  ClipSlotList: ClipSlotList;
  MonitoringEnum: ValueElement;
  KeepRecordMonitoringLatency: ValueElement;
  ClipTimeable: ClipTimeable;
  Recorder: Recorder;
  MidiControllers: MidiControllers;
}

interface FreezeSequencer {
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
  BreakoutIsExpanded: ValueElement;
  On: ManualElement;
  ModulationSourceCount: ValueElement;
  ParametersListWrapper: {
    LomId: ValueElement;
  };
  Pointee: {
    _attrs: { Id: number };
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
  ClipSlotList: ClipSlotList;
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
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  TranspositionModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  TransientEnvelopeModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  GrainSizeModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  FluxModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  SampleOffsetModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  ComplexProFormantsModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  ComplexProEnvelopeModulationTarget: {
    _attrs: { Id: number };
    LockEnvelope: ValueElement;
  };
  PitchViewScrollPosition: ValueElement;
  SampleOffsetModulationScrollPosition: ValueElement;
  Recorder: Recorder;
}

interface DeviceChain {
  AutomationLanes: AutomationLanes;
  ClipEnvelopeChooserViewState: ClipEnvelopeChooserViewState;
  AudioInputRouting: Routing;
  MidiInputRouting: Routing;
  AudioOutputRouting: Routing;
  MidiOutputRouting: Routing;
  Mixer: Mixer;
  MainSequencer: MainSequencer;
  FreezeSequencer: FreezeSequencer;
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

interface TakeLanes {
  TakeLanes: {};
  AreTakeLanesFolded: ValueElement;
}

interface ControllerLayoutCustomization {
  PitchClassSource: ValueElement;
  OctaveSource: ValueElement;
  KeyNoteTarget: ValueElement;
  StepSize: ValueElement;
  OctaveEvery: ValueElement;
  AllowedKeys: ValueElement;
  FillerKeysMapTo: ValueElement;
}

export interface ALSMidiTrackContent {
  _attrs: {
    Id: number;
    SelectedToolPanel: number;
    SelectedTransformationName: string;
    SelectedGeneratorName: string;
  };
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsContentSelectedInDocument: ValueElement;
  PreferredContentViewMode: ValueElement;
  TrackDelay: {
    Value: ValueElement;
    IsValueSampleBased: ValueElement;
  };
  Name: Name;
  Color: ValueElement;
  AutomationEnvelopes: {
    Envelopes: {};
  };
  TrackGroupId: ValueElement;
  TrackUnfolded: ValueElement;
  DevicesListWrapper: {
    LomId: ValueElement;
  };
  ClipSlotsListWrapper: {
    LomId: ValueElement;
  };
  ArrangementClipsListWrapper: {
    LomId: ValueElement;
  };
  TakeLanesListWrapper: {
    LomId: ValueElement;
  };
  ViewData: ValueElement;
  TakeLanes: TakeLanes;
  LinkedTrackGroupId: ValueElement;
  SavedPlayingSlot: ValueElement;
  SavedPlayingOffset: ValueElement;
  Freeze: ValueElement;
  NeedArrangerRefreeze: ValueElement;
  PostProcessFreezeClips: ValueElement;
  DeviceChain: DeviceChain;
  ReWireDeviceMidiTargetId: ValueElement;
  PitchbendRange: ValueElement;
  IsTuned: ValueElement;
  ControllerLayoutRemoteable: ValueElement;
  ControllerLayoutCustomization: ControllerLayoutCustomization;
}

export interface ALSMidiTrack {
  MidiTrack: ALSMidiTrackContent;
}
