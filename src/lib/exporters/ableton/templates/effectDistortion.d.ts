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

interface MidFreq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface BandWidth {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Drive {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DryWet {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Tone {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface PreserveDynamics {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
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

export interface ALSDistortionContent {
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
  MidFreq: MidFreq;
  BandWidth: BandWidth;
  Drive: Drive;
  DryWet: DryWet;
  Tone: Tone;
  PreserveDynamics: PreserveDynamics;
}

export interface ALSDistortion {
  Overdrive: ALSDistortionContent;
}
