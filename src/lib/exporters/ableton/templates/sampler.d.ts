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

interface FileRef {
  RelativePathType: ValueElement;
  RelativePath: ValueElement;
  Path: ValueElement;
  Type: ValueElement;
  LivePackName: ValueElement;
  LivePackId: ValueElement;
  OriginalFileSize: ValueElement;
  OriginalCrc: ValueElement;
}

interface AbletonDefaultPresetRef {
  '@Id': number;
  FileRef: FileRef;
  DeviceId: {
    Name: string;
  };
}

interface PresetRef {
  AbletonDefaultPresetRef: AbletonDefaultPresetRef;
}

interface BranchSourceContext {
  '@Id': number;
  OriginalFileRef: {
    FileRef: FileRef;
  };
  BrowserContentPath: ValueElement;
  LocalFiltersJson: ValueElement;
  PresetRef: PresetRef;
  BranchDeviceId: ValueElement;
}

interface SourceContext {
  Value: BranchSourceContext;
}

interface LastPresetRef {
  Value: any;
}

interface WarpMarker {
  '@Id': number;
  '@SecTime': number;
  '@BeatTime': number;
}

interface WarpMarkers {
  WarpMarker: WarpMarker[];
}

interface TimeSignature {
  TimeSignatures: {
    RemoteableTimeSignature: {
      '@Id': number;
      Numerator: ValueElement;
      Denominator: ValueElement;
      Time: ValueElement;
    };
  };
}

interface BeatGrid {
  FixedNumerator: ValueElement;
  FixedDenominator: ValueElement;
  GridIntervalPixel: ValueElement;
  Ntoles: ValueElement;
  SnapToGrid: ValueElement;
  Fixed: ValueElement;
}

interface SampleWarpProperties {
  WarpMarkers: WarpMarkers;
  WarpMode: ValueElement;
  GranularityTones: ValueElement;
  GranularityTexture: ValueElement;
  FluctuationTexture: ValueElement;
  ComplexProFormants: ValueElement;
  ComplexProEnvelope: ValueElement;
  TransientResolution: ValueElement;
  TransientLoopMode: ValueElement;
  TransientEnvelope: ValueElement;
  IsWarped: ValueElement;
  Onsets: {
    UserOnsets: {};
    HasUserOnsets: ValueElement;
  };
  TimeSignature: TimeSignature;
  BeatGrid: BeatGrid;
}

interface SampleRef {
  FileRef: FileRef;
  LastModDate: ValueElement;
  SourceContext: {};
  SampleUsageHint: ValueElement;
  DefaultDuration: ValueElement;
  DefaultSampleRate: ValueElement;
  SamplesToAutoWarp: ValueElement;
}

interface SustainLoop {
  Start: ValueElement;
  End: ValueElement;
  Mode: ValueElement;
  Crossfade: ValueElement;
  Detune: ValueElement;
}

interface ReleaseLoop {
  Start: ValueElement;
  End: ValueElement;
  Mode: ValueElement;
  Crossfade: ValueElement;
  Detune: ValueElement;
}

interface MultiSamplePart {
  '@Id': number;
  '@InitUpdateAreSlicesFromOnsetsEditableAfterRead': boolean;
  '@HasImportedSlicePoints': boolean;
  '@NeedsAnalysisData': boolean;
  LomId: ValueElement;
  Name: ValueElement;
  Selection: ValueElement;
  IsActive: ValueElement;
  Solo: ValueElement;
  KeyRange: {
    Min: ValueElement;
    Max: ValueElement;
    CrossfadeMin: ValueElement;
    CrossfadeMax: ValueElement;
  };
  VelocityRange: {
    Min: ValueElement;
    Max: ValueElement;
    CrossfadeMin: ValueElement;
    CrossfadeMax: ValueElement;
  };
  SelectorRange: {
    Min: ValueElement;
    Max: ValueElement;
    CrossfadeMin: ValueElement;
    CrossfadeMax: ValueElement;
  };
  RootKey: ValueElement;
  Detune: ValueElement;
  TuneScale: ValueElement;
  Panorama: ValueElement;
  Volume: ValueElement;
  Link: ValueElement;
  SampleStart: ValueElement;
  SampleEnd: ValueElement;
  SustainLoop: SustainLoop;
  ReleaseLoop: ReleaseLoop;
  SampleRef: SampleRef;
  SlicingThreshold: ValueElement;
  SlicingBeatGrid: ValueElement;
  SlicingRegions: ValueElement;
  SlicingStyle: ValueElement;
  SampleWarpProperties: SampleWarpProperties;
  InitialSlicePointsFromOnsets: {};
  SlicePoints: {};
  ManualSlicePoints: {};
  BeatSlicePoints: {};
  RegionSlicePoints: {};
  UseDynamicBeatSlices: ValueElement;
  UseDynamicRegionSlices: ValueElement;
  AreSlicesFromOnsetsEditable: ValueElement;
}

interface SampleParts {
  MultiSamplePart: MultiSamplePart;
}

interface MultiSampleMap {
  SampleParts: SampleParts;
  LoadInRam: ValueElement;
  LayerCrossfade: ValueElement;
  SourceContext: {};
  RoundRobin: ValueElement;
  RoundRobinMode: ValueElement;
  RoundRobinResetPeriod: ValueElement;
  RoundRobinRandomSeed: ValueElement;
}

interface LoopModulator {
  IsModulated: ValueElement;
  SampleStart: ManualElement;
  SampleLength: ManualElement;
  LoopOn: ManualElement;
  LoopLength: ManualElement;
  LoopFade: ManualElement;
}

interface LoopModulators {
  LoopModulator: LoopModulator;
}

interface Player {
  MultiSampleMap: MultiSampleMap;
  LoopModulators: LoopModulators;
  Reverse: ManualElement;
  Snap: ManualElement;
  SampleSelector: ManualElement;
  SubOsc: {
    IsOn: ManualElement;
    Slot: {
      Value: {};
    };
  };
  InterpolationMode: ValueElement;
  UseConstPowCrossfade: ValueElement;
}

interface Pitch {
  TransposeKey: ManualElement;
  TransposeFine: ManualElement;
  PitchLfoAmount: ManualElement;
  Envelope: {
    IsOn: ManualElement;
    Slot: {
      Value: {};
    };
  };
  ScrollPosition: ValueElement;
}

interface SimplerFilter {
  '@Id': number;
  LegacyType: ManualElement;
  Type: ManualElement;
  CircuitLpHp: ManualElement;
  CircuitBpNoMo: ManualElement;
  Slope: ManualElement;
  Freq: ManualElement;
  LegacyQ: ManualElement;
  Res: ManualElement;
  X: ManualElement;
  Drive: ManualElement;
  Envelope: {
    AttackTime: ManualElement;
    AttackLevel: ManualElement;
    AttackSlope: ManualElement;
    DecayTime: ManualElement;
    DecayLevel: ManualElement;
    DecaySlope: ManualElement;
    SustainLevel: ManualElement;
    ReleaseTime: ManualElement;
    ReleaseLevel: ManualElement;
    ReleaseSlope: ManualElement;
    LoopMode: ManualElement;
    LoopTime: ManualElement;
    RepeatTime: ManualElement;
    TimeVelScale: ManualElement;
    CurrentOverlay: ValueElement;
    IsOn: ManualElement;
    Amount: ManualElement;
    ScrollPosition: ValueElement;
  };
  ModByPitch: ManualElement;
  ModByVelocity: ManualElement;
  ModByLfo: ManualElement;
}

interface Filter {
  IsOn: ManualElement;
  Slot: {
    Value: SimplerFilter;
  };
}

interface VolumeAndPan {
  Volume: ManualElement;
  VolumeVelScale: ManualElement;
  VolumeKeyScale: ManualElement;
  VolumeLfoAmount: ManualElement;
  Panorama: ManualElement;
  PanoramaKeyScale: ManualElement;
  PanoramaRnd: ManualElement;
  PanoramaLfoAmount: ManualElement;
  Envelope: {
    AttackTime: ManualElement;
    AttackLevel: ManualElement;
    AttackSlope: ManualElement;
    DecayTime: ManualElement;
    DecayLevel: ManualElement;
    DecaySlope: ManualElement;
    SustainLevel: ManualElement;
    ReleaseTime: ManualElement;
    ReleaseLevel: ManualElement;
    ReleaseSlope: ManualElement;
    LoopMode: ManualElement;
    LoopTime: ManualElement;
    RepeatTime: ManualElement;
    TimeVelScale: ManualElement;
    CurrentOverlay: ValueElement;
  };
  OneShotEnvelope: {
    FadeInTime: ManualElement;
    SustainMode: ManualElement;
    FadeOutTime: ManualElement;
  };
}

export interface ALSMultiSamplerContent {
  '@Id': number;
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
    '@Id': number;
  };
  LastSelectedTimeableIndex: ValueElement;
  LastSelectedClipEnvelopeIndex: ValueElement;
  LastPresetRef: LastPresetRef;
  LockedScripts: {};
  IsFolded: ValueElement;
  ShouldShowPresetName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  SourceContext: SourceContext;
  MpePitchBendUsesTuning: ValueElement;
  OverwriteProtectionNumber: ValueElement;
  Player: Player;
  Pitch: Pitch;
  Filter: Filter;
  Shaper: {
    IsOn: ManualElement;
    Slot: {
      Value: {};
    };
  };
  VolumeAndPan: VolumeAndPan;
  AuxEnv: {
    IsOn: ManualElement;
    Slot: {
      Value: {};
    };
  };
  Lfo: {
    IsOn: ManualElement;
    Slot: {
      Value: {};
    };
  };
  AuxLfos: {
    '0': {
      IsOn: ManualElement;
      Slot: {
        Value: {};
      };
    };
    '1': {
      IsOn: ManualElement;
      Slot: {
        Value: {};
      };
    };
  };
  KeyDst: {
    'ModConnections.0': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
    'ModConnections.1': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
  };
  VelDst: {
    'ModConnections.0': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
    'ModConnections.1': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
  };
  RelVelDst: {
    'ModConnections.0': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
    'ModConnections.1': {
      Amount: ValueElement;
      Connection: ValueElement;
    };
  };
  MidiCtrl: {
    '0': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
    '1': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
    '2': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
    '3': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
    '4': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
    '5': {
      'ModConnections.0': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      'ModConnections.1': {
        Amount: ValueElement;
        Connection: ValueElement;
      };
      Feedback: ValueElement;
    };
  };
  Globals: {
    NumVoices: ValueElement;
    NumVoicesEnvTimeControl: ValueElement;
    RetriggerMode: ValueElement;
    ModulationResolution: ValueElement;
    SpreadAmount: ManualElement;
    KeyZoneShift: ManualElement;
    PortamentoMode: ManualElement;
    PortamentoTime: ManualElement;
    PitchBendRange: ValueElement;
    MpePitchBendRange: ValueElement;
    ScrollPosition: ValueElement;
    EnvScale: {
      EnvTime: ManualElement;
      EnvTimeKeyScale: ManualElement;
      EnvTimeIncludeAttack: ManualElement;
    };
    IsSimpler: ValueElement;
    PlaybackMode: ValueElement;
    LegacyMode: ValueElement;
  };
  ViewSettings: {
    SelectedPage: ValueElement;
    ZoneEditorVisible: ValueElement;
    Seconds: ValueElement;
    SelectedSampleChannel: ValueElement;
    VerticalSampleZoom: ValueElement;
    IsAutoSelectEnabled: ValueElement;
    SimplerBreakoutVisible: ValueElement;
  };
  SimplerSlicing: {
    PlaybackMode: ValueElement;
  };
}

export interface ALSSampler {
  MultiSampler: ALSMultiSamplerContent;
}
