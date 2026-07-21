import { FaderParam, Note, Pad, ProjectRawData } from '../../types/types';
import { getQuarterNotesPerBar } from '../exporters/utils';
import { PreparedXmInstrument } from '../exporters/xm/samples';
import { XmCell, XmPattern } from '../exporters/xm/types';
import { findPad } from '../utils';

type NoteInstance = {
  pad: Pad;
  padCode: string;
  instrument: PreparedXmInstrument;
  note: Note;
  startTick: number;
  noteEndTick: number;
  naturalEndTick: number;
  occupiedUntil: number;
  omitted?: boolean;
  endAction?: {
    tick: number;
    kind: 'keyOff' | 'cut';
  };
};

type CellPlacement = {
  row: number;
  channel: number;
  cell: XmCell;
};

type PatternSegment = {
  startRow: number;
  rows: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function xmTickFromEpTick(value: number, speed: number) {
  return Math.round((value * speed) / 24);
}

function getNaturalEndTick(
  startTick: number,
  note: number,
  instrument: PreparedXmInstrument,
  bpm: number,
) {
  const diskNote = note - 11;
  const frequency =
    8363 * 2 ** ((diskNote - 1 + instrument.relativeNote - 48 + instrument.finetune / 128) / 12);
  const seconds = instrument.sampleFrames / frequency;
  return startTick + Math.max(1, Math.ceil((seconds * bpm) / 2.5));
}

function getPatternSegments(data: ProjectRawData) {
  const quarterNotesPerBar = getQuarterNotesPerBar(
    data.scenesSettings.timeSignature.numerator,
    data.scenesSettings.timeSignature.denominator,
  );
  const rowsPerBar = Math.max(1, Math.round(quarterNotesPerBar * 4));

  const segments: PatternSegment[] = [];
  const sceneStarts: number[] = [];
  const sceneRows: number[] = [];
  let currentRow = 0;

  for (const scene of data.scenes) {
    const bars = Math.max(...scene.patterns.map((pattern) => pattern.bars));
    const rows = Math.max(1, bars * rowsPerBar);
    sceneStarts.push(currentRow);
    sceneRows.push(rows);

    let remaining = rows;
    while (remaining > 0) {
      const segmentRows = Math.min(256, remaining);
      segments.push({ startRow: currentRow + rows - remaining, rows: segmentRows });
      remaining -= segmentRows;
    }
    currentRow += rows;
  }

  if (segments.length > 256) {
    throw new Error("The selected scenes require more than FastTracker 2's 256 order entries");
  }

  return { rowsPerBar, segments, sceneStarts, sceneRows, totalRows: currentRow };
}

function getVelocity(note: Note, pad: Pad, data: ProjectRawData, instrument: PreparedXmInstrument) {
  const velocityFader = data.settings.groupFaderParams[pad.group][FaderParam.VEL];
  const velocity = velocityFader !== -1 ? velocityFader * 127 : note.velocity;
  const volume = (velocity / 127) * instrument.instrument.sample.volume;
  return 0x10 + clamp(Math.round(volume), 0, 64);
}

function collectNoteInstances(
  data: ProjectRawData,
  instruments: Map<string, PreparedXmInstrument>,
  speed: number,
  bpm: number,
  sceneStarts: number[],
  sceneRows: number[],
  rowsPerBar: number,
) {
  const instances: NoteInstance[] = [];

  data.scenes.forEach((scene, sceneIndex) => {
    const sceneStartTick = sceneStarts[sceneIndex] * speed;
    const sceneLengthTicks = sceneRows[sceneIndex] * speed;

    for (const pattern of scene.patterns) {
      const instrument = instruments.get(pattern.pad);
      const pad = findPad(pattern.pad, data.pads);
      if (!instrument || !pad) {
        continue;
      }

      const patternLengthTicks = Math.max(1, pattern.bars * rowsPerBar * speed);
      for (let repetition = 0; repetition < sceneLengthTicks; repetition += patternLengthTicks) {
        for (const note of pattern.notes) {
          const patternLengthEpTicks = pattern.bars * rowsPerBar * 24;
          if (note.position >= patternLengthEpTicks) {
            continue;
          }
          const localStart = Math.min(
            patternLengthTicks - 1,
            xmTickFromEpTick(note.position, speed),
          );

          const startTick = sceneStartTick + repetition + localStart;
          if (startTick >= sceneStartTick + sceneLengthTicks) {
            continue;
          }

          const durationTicks = Math.max(1, xmTickFromEpTick(note.duration, speed));

          const noteEndTick = startTick + durationTicks;
          const naturalEndTick = getNaturalEndTick(startTick, note.note, instrument, bpm);
          const gated = pad.playMode !== 'oneshot' || instrument.loops;
          const sampleEndsBeforeKeyOff = !instrument.loops && naturalEndTick <= noteEndTick;
          const endAction =
            gated && !sampleEndsBeforeKeyOff
              ? {
                  tick: noteEndTick,
                  kind: instrument.releaseTicks > 0 ? ('keyOff' as const) : ('cut' as const),
                }
              : undefined;
          const releasedEndTick = noteEndTick + instrument.releaseTicks;
          instances.push({
            pad,
            padCode: pattern.pad,
            instrument,
            note,
            startTick,
            noteEndTick,
            naturalEndTick,
            occupiedUntil: endAction
              ? instrument.loops
                ? releasedEndTick
                : Math.min(naturalEndTick, releasedEndTick)
              : naturalEndTick,
            endAction,
          });
        }
      }
    }
  });

  instances.sort((a, b) => a.startTick - b.startTick || a.padCode.localeCompare(b.padCode));
  const activeChokeNotes: NoteInstance[] = [];
  for (const instance of instances) {
    for (let i = activeChokeNotes.length - 1; i >= 0; i--) {
      if (activeChokeNotes[i].occupiedUntil <= instance.startTick) {
        activeChokeNotes.splice(i, 1);
      }
    }

    if (instance.pad.inChokeGroup) {
      for (const active of activeChokeNotes) {
        if (active.startTick === instance.startTick) {
          active.omitted = true;
        } else {
          active.occupiedUntil = instance.startTick;
          active.endAction = { tick: instance.startTick, kind: 'cut' };
        }
      }
      activeChokeNotes.length = 0;
      activeChokeNotes.push(instance);
    }
  }

  return instances;
}

function getEndCell(kind: 'keyOff' | 'cut', tickOffset: number): XmCell {
  if (kind === 'cut') {
    return { effect: 0x0e, effectParameter: 0xc0 | tickOffset };
  }
  if (tickOffset === 0) {
    return { note: 97 };
  }
  return { effect: 0x14, effectParameter: tickOffset };
}

function allocateChannels(
  instances: NoteInstance[],
  data: ProjectRawData,
  speed: number,
  totalRows: number,
) {
  const validInstances = instances.filter((instance) => {
    if (instance.omitted) {
      return false;
    }

    const diskNote = instance.note.note - 11;
    const realNote = diskNote - 1 + instance.instrument.relativeNote;
    if (diskNote < 1 || diskNote > 96 || realNote < 0 || realNote > 118) {
      return false;
    }
    return true;
  });

  const byPad = new Map<string, NoteInstance[]>();
  for (const instance of validInstances) {
    const arr = byPad.get(instance.padCode);
    if (arr) {
      arr.push(instance);
    } else {
      byPad.set(instance.padCode, [instance]);
    }
  }

  const padCodes = [...byPad.keys()].sort((a, b) => {
    const aNum = byPad.get(a)?.[0].instrument.number ?? 0;
    const bNum = byPad.get(b)?.[0].instrument.number ?? 0;
    return aNum - bNum;
  });

  const padPolyphony = new Map<string, number>();
  for (const padCode of padCodes) {
    const padInstances = byPad.get(padCode) ?? [];
    const isMonophonic = padInstances.some(
      (instance) => instance.pad.playMode === 'oneshot' || instance.pad.playMode === 'legato',
    );
    let max = 1;
    if (!isMonophonic) {
      const sorted = [...padInstances].sort((a, b) => a.startTick - b.startTick);
      const active: NoteInstance[] = [];
      for (const instance of sorted) {
        for (let i = active.length - 1; i >= 0; i--) {
          if (active[i].noteEndTick <= instance.startTick) {
            active.splice(i, 1);
          }
        }
        active.push(instance);
        if (active.length > max) {
          max = active.length;
        }
      }
    }
    padPolyphony.set(padCode, max);
  }

  let nextChannel = 0;
  const padChannels = new Map<string, number[]>();
  for (const padCode of padCodes) {
    const poly = padPolyphony.get(padCode) ?? 1;
    const channels: number[] = [];
    for (let i = 0; i < poly; i++) {
      channels.push(nextChannel++);
    }
    padChannels.set(padCode, channels);
  }

  if (nextChannel > 32) {
    throw new Error("This project uses more than FastTracker 2's 32 available channels");
  }

  const placements = new Map<string, CellPlacement & { kind: 'start' | 'end'; tick: number }>();
  const pendingEnds = new Map<number, { key: string; tick: number }>();
  const channelFreeAt = new Array<number>(nextChannel).fill(0);

  const ordered = [...validInstances].sort(
    (a, b) => a.startTick - b.startTick || a.padCode.localeCompare(b.padCode),
  );

  for (const instance of ordered) {
    const diskNote = instance.note.note - 11;
    const pool = padChannels.get(instance.padCode) ?? [];
    const startRow = Math.floor(instance.startTick / speed);
    const startOffset = instance.startTick % speed;

    let channel = -1;
    for (const candidate of pool) {
      if (channelFreeAt[candidate] > instance.startTick) {
        continue;
      }
      if (placements.has(`${startRow}:${candidate}`)) {
        continue;
      }
      channel = candidate;
      break;
    }
    if (channel === -1) {
      channel = pool[0];
    }

    const pendingEnd = pendingEnds.get(channel);
    if (pendingEnd) {
      if (
        pendingEnd.tick >= instance.startTick ||
        Math.floor(pendingEnd.tick / speed) === startRow
      ) {
        placements.delete(pendingEnd.key);
      }
      pendingEnds.delete(channel);
    }

    const startKey = `${startRow}:${channel}`;
    const existing = placements.get(startKey);
    if (existing?.kind === 'end') {
      placements.delete(startKey);
    }

    let endAction = instance.endAction;
    let combinedEnd = false;

    if (endAction) {
      const endRow = Math.floor(endAction.tick / speed);
      const endOffset = endAction.tick % speed;
      if (endRow === startRow) {
        if (startOffset === 0 && endOffset > 0) {
          combinedEnd = true;
        } else {
          endAction = { ...endAction, tick: (startRow + 1) * speed };
        }
      }

      if (endAction && !instance.instrument.loops && instance.naturalEndTick <= endAction.tick) {
        endAction = undefined;
        combinedEnd = false;
        instance.occupiedUntil = instance.naturalEndTick;
      } else if (endAction) {
        const releaseTicks = endAction.kind === 'keyOff' ? instance.instrument.releaseTicks : 0;
        const releasedEndTick = endAction.tick + releaseTicks;
        instance.occupiedUntil = instance.instrument.loops
          ? releasedEndTick
          : Math.min(instance.naturalEndTick, releasedEndTick);
      }
    }

    const startCell: XmCell = {
      note: diskNote,
      instrument: instance.instrument.number,
      volume: getVelocity(instance.note, instance.pad, data, instance.instrument),
    };

    if (startOffset > 0) {
      startCell.effect = 0x0e;
      startCell.effectParameter = 0xd0 | startOffset;
    } else if (combinedEnd && endAction) {
      Object.assign(startCell, getEndCell(endAction.kind, endAction.tick % speed));
    }
    placements.set(startKey, {
      row: startRow,
      channel,
      cell: startCell,
      kind: 'start',
      tick: instance.startTick,
    });
    channelFreeAt[channel] = instance.occupiedUntil;

    if (endAction && !combinedEnd) {
      const endRow = Math.floor(endAction.tick / speed);
      if (endRow < totalRows) {
        const endKey = `${endRow}:${channel}`;
        placements.set(endKey, {
          row: endRow,
          channel,
          cell: getEndCell(endAction.kind, endAction.tick % speed),
          kind: 'end',
          tick: endAction.tick,
        });
        pendingEnds.set(channel, { key: endKey, tick: endAction.tick });
      }
    }
  }

  const channels = Math.max(2, Math.ceil(nextChannel / 2) * 2);
  return { channels, placements: [...placements.values()] };
}

function buildPatterns(segments: PatternSegment[], placements: CellPlacement[], channels: number) {
  return segments.map<XmPattern>((segment) => {
    const cells = new Map<number, XmCell>();
    for (const placement of placements) {
      if (placement.row < segment.startRow || placement.row >= segment.startRow + segment.rows) {
        continue;
      }
      const row = placement.row - segment.startRow;
      cells.set(row * channels + placement.channel, placement.cell);
    }
    return { rows: segment.rows, cells };
  });
}

export function xmTransform({
  data,
  instruments,
  speed,
  bpm,
}: {
  data: ProjectRawData;
  instruments: Map<string, PreparedXmInstrument>;
  speed: number;
  bpm: number;
}) {
  if (data.scenes.length === 0) {
    throw new Error('Select at least one scene to export');
  }

  const layout = getPatternSegments(data);
  const instances = collectNoteInstances(
    data,
    instruments,
    speed,
    bpm,
    layout.sceneStarts,
    layout.sceneRows,
    layout.rowsPerBar,
  );
  const allocation = allocateChannels(instances, data, speed, layout.totalRows);
  const patterns = buildPatterns(layout.segments, allocation.placements, allocation.channels);

  return {
    channels: allocation.channels,
    patterns,
  };
}
