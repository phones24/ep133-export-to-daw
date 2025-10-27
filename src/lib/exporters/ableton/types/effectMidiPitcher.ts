import {
  AutomationTarget,
  LastPresetRef,
  LomIdElement,
  MidiCCOnOffThresholds,
  MidiControllerRange,
  ModulationTarget,
  On,
  SourceContext,
  ValueElement,
} from './common';

interface PitchParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface PitchScaleDegreesParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface LowestParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface RangeParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface RangeModeParam {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
}

interface UseSongScaleParam {
  LomId: ValueElement;
  Manual: ValueElement;
  AutomationTarget: AutomationTarget;
  MidiCCOnOffThresholds: MidiCCOnOffThresholds;
}

interface StepWidthParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

interface StepWidthScaleDegreesParam {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

export interface ALSMidiPitcherContent {
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
  Pitch: PitchParam;
  PitchScrollPosArranger: ValueElement;
  PitchScrollPosEnvelope: ValueElement;
  PitchScaleDegrees: PitchScaleDegreesParam;
  PitchScaleDegreesScrollPosArranger: ValueElement;
  PitchScaleDegreesScrollPosEnvelope: ValueElement;
  Lowest: LowestParam;
  LowestScrollPosArranger: ValueElement;
  LowestScrollPosEnvelope: ValueElement;
  Range: RangeParam;
  RangeMode: RangeModeParam;
  UseSongScale: UseSongScaleParam;
  StepWidth: StepWidthParam;
  StepWidthScaleDegrees: StepWidthScaleDegreesParam;
}

export interface ALSMidiPitcher {
  MidiPitcher: ALSMidiPitcherContent;
}
