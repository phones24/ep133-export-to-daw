import { ALSDrumBranchContent } from './drumBranch';

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

interface MidiControllerRange {
  Min: ValueElement;
  Max: ValueElement;
}

interface ModulationTarget {
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

interface MacroControl {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface FileRef {
  '@Id'?: number;
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

interface BranchSourceContext {
  '@Id': number;
  OriginalFileRef: {
    FileRef: FileRef;
  };
  BrowserContentPath: ValueElement;
  PresetRef: {
    AbletonDefaultPresetRef: AbletonDefaultPresetRef;
  };
  BranchDeviceId: ValueElement;
}

interface SourceContext {
  Value: BranchSourceContext;
}

interface ChainSelector {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface MacroVariations {
  MacroSnapshots: {};
}

export interface ALSDrumRackContent {
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
  Branches: {
    DrumBranch: ALSDrumBranchContent[];
  };
  IsBranchesListVisible: ValueElement;
  IsReturnBranchesListVisible: ValueElement;
  IsRangesEditorVisible: ValueElement;
  AreDevicesVisible: ValueElement;
  NumVisibleMacroControls: ValueElement;
  MacroControls: { [key: string]: MacroControl };
  MacroDisplayNames: { [key: string]: ValueElement };
  MacroDefaults: { [key: string]: ValueElement };
  MacroAnnotations: { [key: string]: ValueElement };
  ForceDisplayGenericValue: { [key: string]: ValueElement };
  AreMacroControlsVisible: ValueElement;
  IsAutoSelectEnabled: ValueElement;
  ChainSelector: ChainSelector;
  ChainSelectorRelativePosition: ValueElement;
  ViewsToRestoreWhenUnfolding: ValueElement;
  ReturnBranches: {};
  BranchesSplitterProportion: ValueElement;
  ShowBranchesInSessionMixer: ValueElement;
  MacroColor: { [key: string]: ValueElement };
  LockId: ValueElement;
  LockSeal: ValueElement;
  ChainsListWrapper: LomIdElement;
  ReturnChainsListWrapper: LomIdElement;
  MacroVariations: MacroVariations;
  ExcludeMacroFromRandomization: { [key: string]: ValueElement };
  ExcludeMacroFromSnapshots: { [key: string]: ValueElement };
  AreMacroVariationsControlsVisible: ValueElement;
  ChainSelectorFilterMidiCtrl: ValueElement;
  RangeTypeIndex: ValueElement;
  ShowsZonesInsteadOfNoteNames: ValueElement;
  IsMidiSectionVisible: ValueElement;
  AreSendsVisible: ValueElement;
  ArePadsVisible: ValueElement;
  PadScrollPosition: ValueElement;
  DrumPadsListWrapper: LomIdElement;
  VisibleDrumPadsListWrapper: LomIdElement;
}

export interface ALSDrumRack {
  DrumGroupDevice: ALSDrumRackContent;
}
