interface ValueElement {
  '@Value': any;
}

interface LomIdElement {
  LomId: ValueElement;
}

interface AutomationTarget {
  '@Id': number;
  LockEnvelope: ValueElement;
}

interface MidiCCOnOffThresholds {
  Min: ValueElement;
  Max: ValueElement;
}

interface On {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface MidiControllerRange {
  Min: ValueElement;
  Max: ValueElement;
}

interface ModulationTarget {
  '@Id': number;
  LockEnvelope: ValueElement;
}

interface Threshold {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Ratio {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ExpansionRatio {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Attack {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Release {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface AutoReleaseControlOnOff {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface Gain {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface GainCompensation {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface DryWet {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Model {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface LegacyModel {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface LogEnvelope {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface LegacyEnvFollowerMode {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface Knee {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface LookAhead {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface SideListen {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface MpeSettings {
  ZoneType: ValueElement;
  FirstNoteChannel: ValueElement;
  LastNoteChannel: ValueElement;
}

interface Routable {
  Target: ValueElement;
  UpperDisplayString: ValueElement;
  LowerDisplayString: ValueElement;
  MpeSettings: MpeSettings;
}

interface Volume {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface RoutedInput {
  Routable: Routable;
  Volume: Volume;
}

interface OnOff {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface SideChain {
  OnOff: OnOff;
  RoutedInput: RoutedInput;
  DryWet: DryWet;
}

interface Mode {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface Freq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Q {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface SideChainEq {
  On: On;
  Mode: Mode;
  Freq: Freq;
  Q: Q;
  Gain: Gain;
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
    '@Name': string;
  };
}

interface LastPresetRef {
  Value: AbletonDefaultPresetRef;
}

interface OriginalFileRef {
  FileRef: FileRef;
}

interface PresetRef {
  AbletonDefaultPresetRef: AbletonDefaultPresetRef;
}

interface BranchSourceContext {
  '@Id': number;
  OriginalFileRef: OriginalFileRef;
  BrowserContentPath: ValueElement;
  PresetRef: PresetRef;
  BranchDeviceId: ValueElement;
}

interface SourceContext {
  Value: BranchSourceContext;
}

export interface ALSCompressorContent {
  '@Id': number;
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsExpanded: ValueElement;
  On: On;
  ModulationSourceCount: ValueElement;
  ParametersListWrapper: LomIdElement;
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
  OverwriteProtectionNumber: ValueElement;
  Threshold: Threshold;
  Ratio: Ratio;
  ExpansionRatio: ExpansionRatio;
  Attack: Attack;
  Release: Release;
  AutoReleaseControlOnOff: AutoReleaseControlOnOff;
  Gain: Gain;
  GainCompensation: GainCompensation;
  DryWet: DryWet;
  Model: Model;
  LegacyModel: LegacyModel;
  LogEnvelope: LogEnvelope;
  LegacyEnvFollowerMode: LegacyEnvFollowerMode;
  Knee: Knee;
  LookAhead: LookAhead;
  SideListen: SideListen;
  SideChain: SideChain;
  SideChainEq: SideChainEq;
  Live8LegacyMode: ValueElement;
  ViewMode: ValueElement;
  IsOutputCurveVisible: ValueElement;
  RmsTimeShort: ValueElement;
  RmsTimeLong: ValueElement;
  ReleaseTimeShort: ValueElement;
  ReleaseTimeLong: ValueElement;
  CrossfaderSmoothingTime: ValueElement;
}

export interface ALSCompressor {
  Compressor2: ALSCompressorContent;
}
