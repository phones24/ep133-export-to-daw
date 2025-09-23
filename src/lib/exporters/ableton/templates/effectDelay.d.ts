import {
  AutomationTarget,
  LomIdElement,
  MidiCCOnOffThresholds,
  MidiControllerRange,
  ModulationTarget,
  On,
  SourceContext,
  ValueElement,
} from './common';

interface DelayLine_SmoothingMode {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface DelayLine_Link {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface DelayLine_PingPong {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface DelayLine_SyncL {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface DelayLine_SyncR {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface DelayLine_TimeL {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_TimeR {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_SimpleDelayTimeL {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_SimpleDelayTimeR {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_PingPongDelayTimeL {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_PingPongDelayTimeR {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_SyncedSixteenthL {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface DelayLine_SyncedSixteenthR {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface DelayLine_OffsetL {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface DelayLine_OffsetR {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Feedback {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Freeze {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface Filter_On {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface Filter_Frequency {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Filter_Bandwidth {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Modulation_Frequency {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Modulation_AmountTime {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface Modulation_AmountFilter {
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

export interface ALSDelayContent {
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
  DelayLine_SmoothingMode: DelayLine_SmoothingMode;
  DelayLine_Link: DelayLine_Link;
  DelayLine_PingPong: DelayLine_PingPong;
  DelayLine_SyncL: DelayLine_SyncL;
  DelayLine_SyncR: DelayLine_SyncR;
  DelayLine_TimeL: DelayLine_TimeL;
  DelayLine_TimeR: DelayLine_TimeR;
  DelayLine_SimpleDelayTimeL: DelayLine_SimpleDelayTimeL;
  DelayLine_SimpleDelayTimeR: DelayLine_SimpleDelayTimeR;
  DelayLine_PingPongDelayTimeL: DelayLine_PingPongDelayTimeL;
  DelayLine_PingPongDelayTimeR: DelayLine_PingPongDelayTimeR;
  DelayLine_SyncedSixteenthL: DelayLine_SyncedSixteenthL;
  DelayLine_SyncedSixteenthR: DelayLine_SyncedSixteenthR;
  DelayLine_OffsetL: DelayLine_OffsetL;
  DelayLine_OffsetR: DelayLine_OffsetR;
  DelayLine_CompatibilityMode: ValueElement;
  Feedback: Feedback;
  Freeze: Freeze;
  Filter_On: Filter_On;
  Filter_Frequency: Filter_Frequency;
  Filter_Bandwidth: Filter_Bandwidth;
  Modulation_Frequency: Modulation_Frequency;
  Modulation_AmountTime: Modulation_AmountTime;
  Modulation_AmountFilter: Modulation_AmountFilter;
  DryWet: DryWet;
  DryWetMode: ValueElement;
  EcoProcessing: ValueElement;
}

export interface ALSDelay {
  Delay: ALSDelayContent;
}
