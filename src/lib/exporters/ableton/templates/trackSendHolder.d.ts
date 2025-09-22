interface ValueElement {
  '@Value': any;
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
