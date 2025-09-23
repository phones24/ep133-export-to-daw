import { AutomationTarget, MidiControllerRange, ModulationTarget, ValueElement } from './common';

interface Send {
  LomId: ValueElement;
  Manual: ValueElement;
  MidiControllerRange: MidiControllerRange;
  AutomationTarget: AutomationTarget;
  ModulationTarget: ModulationTarget;
}

export interface ALSTrackSendHolderContent {
  '@Id': number;
  Send: Send;
  Active: ValueElement;
}

export interface ALSTrackSendHolder {
  TrackSendHolder: ALSTrackSendHolderContent;
}
