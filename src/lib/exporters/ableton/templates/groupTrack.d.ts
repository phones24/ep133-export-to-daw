import { LomIdElement, ValueElement } from './common';
import { Mixer } from './midiTrack';

interface Name {
  EffectiveName: ValueElement;
  UserName: ValueElement;
  Annotation: ValueElement;
  MemorizedFirstClipName: ValueElement;
}

interface TrackDelay {
  Value: ValueElement;
  IsValueSampleBased: ValueElement;
}

interface TakeLanes {
  TakeLanes: {};
  AreTakeLanesFolded: ValueElement;
}

interface GroupTrackSlot {
  '@Id': number;
  LomId: ValueElement;
}

interface Slots {
  GroupTrackSlot: GroupTrackSlot[];
}

interface DeviceChain {
  Mixer: Mixer;
}

export interface ALSGroupTrackContent {
  '@Id': number;
  '@_internalId'?: string;
  LomId: ValueElement;
  LomIdView: ValueElement;
  IsContentSelectedInDocument: ValueElement;
  PreferredContentViewMode: ValueElement;
  TrackDelay: TrackDelay;
  Name: Name;
  Color: ValueElement;
  AutomationEnvelopes: {
    Envelopes: {};
  };
  TrackGroupId: ValueElement;
  TrackUnfolded: ValueElement;
  DevicesListWrapper: LomIdElement;
  ClipSlotsListWrapper: LomIdElement;
  ViewData: ValueElement;
  TakeLanes: TakeLanes;
  LinkedTrackGroupId: ValueElement;
  Slots: Slots;
  DeviceChain: DeviceChain;
}

export interface ALSGroupTrack {
  GroupTrack: ALSGroupTrackContent;
}
