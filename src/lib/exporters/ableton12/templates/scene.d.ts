// Types for scene.xml template
interface ValueElement {
  _attrs: {
    Value: any;
  };
}

interface SceneAttrs {
  Id: number;
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
  _attrs: SceneAttrs;
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
    _attrs: {
      LomId: number;
    };
  };
}

export interface ALSScene {
  Scene: ALSSceneContent;
}
