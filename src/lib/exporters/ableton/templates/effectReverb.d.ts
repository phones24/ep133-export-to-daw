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

interface PreDelay {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface BandHighOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface BandLowOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface BandFreq {
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

interface SpinOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface EarlyReflectModFreq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface EarlyReflectModDepth {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DiffuseDelay {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ShelfHighOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface HighFilterType {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface ShelfHiFreq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ShelfHiGain {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ShelfLowOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface ShelfLoFreq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ShelfLoGain {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface ChorusOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface SizeModFreq {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface SizeModDepth {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DecayTime {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface AllPassGain {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface AllPassSize {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface FreezeOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface FlatOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface CutOn {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface RoomSize {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface SizeSmoothing {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface StereoSeparation {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface RoomType {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface MixReflect {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface MixDiffuse {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface MixDirect {
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

export interface ALSReverbContent {
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
  PreDelay: PreDelay;
  BandHighOn: BandHighOn;
  BandLowOn: BandLowOn;
  BandFreq: BandFreq;
  BandWidth: BandWidth;
  SpinOn: SpinOn;
  EarlyReflectModFreq: EarlyReflectModFreq;
  EarlyReflectModDepth: EarlyReflectModDepth;
  DiffuseDelay: DiffuseDelay;
  ShelfHighOn: ShelfHighOn;
  HighFilterType: HighFilterType;
  ShelfHiFreq: ShelfHiFreq;
  ShelfHiGain: ShelfHiGain;
  ShelfLowOn: ShelfLowOn;
  ShelfLoFreq: ShelfLoFreq;
  ShelfLoGain: ShelfLoGain;
  ChorusOn: ChorusOn;
  SizeModFreq: SizeModFreq;
  SizeModDepth: SizeModDepth;
  DecayTime: DecayTime;
  AllPassGain: AllPassGain;
  AllPassSize: AllPassSize;
  FreezeOn: FreezeOn;
  FlatOn: FlatOn;
  CutOn: CutOn;
  RoomSize: RoomSize;
  SizeSmoothing: SizeSmoothing;
  StereoSeparation: StereoSeparation;
  RoomType: RoomType;
  MixReflect: MixReflect;
  MixDiffuse: MixDiffuse;
  MixDirect: MixDirect;
  StereoSeparationOnDrySignal: ValueElement;
}

export interface ALSReverb {
  Reverb: ALSReverbContent;
}
