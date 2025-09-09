// Types for midiClip.xml template
interface ValueElement {
  _attrs: {
    Value: any;
  };
}

interface MidiClipAttrs {
  Id: number;
  Time: number;
}

interface MidiNoteEvent {
  _attrs: {
    Time: number;
    Duration: number;
    Velocity: number;
    OffVelocity: number;
    NoteId: number;
  };
}

interface KeyTrack {
  _attrs: {
    Id: number;
  };
  Notes: {
    MidiNoteEvent: MidiNoteEvent[];
  };
  MidiKey: ValueElement;
}

export interface ALSMidiClipContent {
  _attrs: MidiClipAttrs;
  LomId: ValueElement;
  LomIdView: ValueElement;
  CurrentStart: ValueElement;
  CurrentEnd: ValueElement;
  Loop: {
    LoopStart: ValueElement;
    LoopEnd: ValueElement;
    StartRelative: ValueElement;
    LoopOn: ValueElement;
    OutMarker: ValueElement;
    HiddenLoopStart: ValueElement;
    HiddenLoopEnd: ValueElement;
  };
  Name: ValueElement;
  Annotation: ValueElement;
  Color: ValueElement;
  LaunchMode: ValueElement;
  LaunchQuantisation: ValueElement;
  TimeSignature: {
    TimeSignatures: {
      RemoteableTimeSignature: {
        _attrs: { Id: number };
        Numerator: ValueElement;
        Denominator: ValueElement;
        Time: ValueElement;
      };
    };
  };
  Envelopes: {
    Envelopes: {};
  };
  ScrollerTimePreserver: {
    LeftTime: ValueElement;
    RightTime: ValueElement;
  };
  TimeSelection: {
    AnchorTime: ValueElement;
    OtherTime: ValueElement;
  };
  Legato: ValueElement;
  Ram: ValueElement;
  GrooveSettings: {
    GrooveId: ValueElement;
  };
  Disabled: ValueElement;
  VelocityAmount: ValueElement;
  FollowAction: {
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
  };
  Grid: {
    FixedNumerator: ValueElement;
    FixedDenominator: ValueElement;
    GridIntervalPixel: ValueElement;
    Ntoles: ValueElement;
    SnapToGrid: ValueElement;
    Fixed: ValueElement;
  };
  FreezeStart: ValueElement;
  FreezeEnd: ValueElement;
  IsWarped: ValueElement;
  TakeId: ValueElement;
  IsInKey: ValueElement;
  ScaleInformation: {
    Root: ValueElement;
    Name: ValueElement;
  };
  Notes: {
    KeyTracks: {
      KeyTrack: KeyTrack[];
    };
    PerNoteEventStore: {
      EventLists: {};
    };
    NoteProbabilityGroups: {};
    ProbabilityGroupIdGenerator: {
      NextId: ValueElement;
    };
    NoteIdGenerator: {
      NextId: ValueElement;
    };
  };
  BankSelectCoarse: ValueElement;
  BankSelectFine: ValueElement;
  ProgramChange: ValueElement;
  NoteEditorFoldInZoom: ValueElement;
  NoteEditorFoldInScroll: ValueElement;
  NoteEditorFoldOutZoom: ValueElement;
  NoteEditorFoldOutScroll: ValueElement;
  NoteSpellingPreference: ValueElement;
  AccidentalSpellingPreference: ValueElement;
  PreferFlatRootNote: ValueElement;
  ExpressionGrid: {
    FixedNumerator: ValueElement;
    FixedDenominator: ValueElement;
    GridIntervalPixel: ValueElement;
    Ntoles: ValueElement;
    SnapToGrid: ValueElement;
    Fixed: ValueElement;
  };
}

export interface ALSMidiClip {
  MidiClip: ALSMidiClipContent;
}
