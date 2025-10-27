import {
  AutomationTarget,
  LomIdElement,
  MidiControllerRange,
  ModulationTarget,
  On,
  SourceContext,
  ValueElement,
} from './common';

interface Name {
  EffectiveName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  MemorizedFirstClipName: ValueElement;
}

interface MidiToAudioDeviceChain {
  '@Id': number;
  Devices: {};
  SignalModulations: {};
}

interface DeviceChain {
  MidiToAudioDeviceChain: MidiToAudioDeviceChain;
}

interface BranchSelectorRange {
  Min: ValueElement;
  Max: ValueElement;
  CrossfadeMin: ValueElement;
  CrossfadeMax: ValueElement;
}

interface Volume {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Panorama {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
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

interface RoutingHelper {
  Routable: Routable;
  TargetEnum: ValueElement;
}

interface MixerDevice {
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
  LastPresetRef: {
    Value: {};
  };
  LockedScripts: {};
  IsFolded: ValueElement;
  ShouldShowPresetName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  SourceContext: SourceContext;
  OverwriteProtectionNumber: ValueElement;
  Speaker: On;
  Volume: Volume;
  Panorama: Panorama;
  SendInfos: {};
  RoutingHelper: RoutingHelper;
  SendsListWrapper: LomIdElement;
}

interface BranchInfo {
  ReceivingNote: ValueElement;
  SendingNote: ValueElement;
  ChokeGroup: ValueElement;
}

export interface ALSDrumBranchContent {
  '@Id': number;
  LomId: ValueElement;
  Name: Name;
  IsSelected: ValueElement;
  DeviceChain: DeviceChain;
  BranchSelectorRange: BranchSelectorRange;
  IsSoloed: ValueElement;
  SessionViewBranchWidth: ValueElement;
  IsHighlightedInSessionView: ValueElement;
  SourceContext: SourceContext;
  Color: ValueElement;
  AutoColored: ValueElement;
  AutoColorScheme: ValueElement;
  SoloActivatedInSessionMixer: ValueElement;
  DevicesListWrapper: LomIdElement;
  MixerDevice: MixerDevice;
  BranchInfo: BranchInfo;
}

export interface ALSDrumBranch {
  DrumBranch: ALSDrumBranchContent;
}
