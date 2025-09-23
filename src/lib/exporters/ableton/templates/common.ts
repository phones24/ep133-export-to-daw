export interface ValueElement {
  '@Value': any;
}

export interface LomIdElement {
  LomId: ValueElement;
}

export interface AutomationTarget {
  '@Id': number;
  LockEnvelope: ValueElement;
}

export interface MidiCCOnOffThresholds {
  Min: ValueElement;
  Max: ValueElement;
}

export interface On {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

export interface MidiControllerRange {
  Min: ValueElement;
  Max: ValueElement;
}

export interface ModulationTarget {
  '@Id': number;
  LockEnvelope: ValueElement;
}

export interface FileRef {
  RelativePathType: ValueElement;
  RelativePath: ValueElement;
  Path: ValueElement;
  Type: ValueElement;
  LivePackName: ValueElement;
  LivePackId: ValueElement;
  OriginalFileSize: ValueElement;
  OriginalCrc: ValueElement;
}

export interface AbletonDefaultPresetRef {
  '@Id': number;
  FileRef: FileRef;
  DeviceId: {
    '@Name': string;
  };
}

export interface LastPresetRef {
  Value: AbletonDefaultPresetRef;
}

export interface OriginalFileRef {
  FileRef: FileRef;
}

export interface PresetRef {
  AbletonDefaultPresetRef: AbletonDefaultPresetRef;
}

export interface BranchSourceContext {
  '@Id': number;
  OriginalFileRef: OriginalFileRef;
  BrowserContentPath: ValueElement;
  PresetRef: PresetRef;
  BranchDeviceId: ValueElement;
}

export interface SourceContext {
  Value: BranchSourceContext;
}
