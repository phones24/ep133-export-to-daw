interface ValueElement {
  '@Value': any;
}

interface FollowAction {
  FollowTime: ValueElement;
  IsLinked: ValueElement;
  LoopIterations: ValueElement;
  FollowActionA: ValueElement;
  FollowActionB: ValueElement;
  FollowChanceA: ValueElement;
  FollowChanceB: ValueElement;
  JumpIndexA: ValueElement;
  JumpIndexB: ValueElement;
  FollowActionEnabled: ValueElement;
}

export interface ALSSceneContent {
  '@Id': number;
  FollowAction: FollowAction;
  Name: ValueElement;
  Annotation: ValueElement;
  Color: ValueElement;
  Tempo: ValueElement;
  IsTempoEnabled: ValueElement;
  TimeSignatureId: ValueElement;
  IsTimeSignatureEnabled: ValueElement;
  LomId: ValueElement;
  ClipSlotsListWrapper: {
    '@LomId': number;
  };
}

export interface ALSScene {
  Scene: ALSSceneContent;
}
